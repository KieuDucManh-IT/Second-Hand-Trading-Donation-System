const mongoose = require('mongoose');

const Conversation = require('../models/modelConversation');
const Message      = require('../models/modelMessage');
const Product      = require('../models/modelProduct');
const ProductImage = require('../models/modelProductImage');

// ── Helper: format 1 conversation cho response (kèm tên/avatar người còn lại) ──
const formatConversation = async (conv, currentUserId) => {
  const other = conv.participants.find(
    (p) => p._id.toString() !== currentUserId.toString()
  );

  let productTitle = null;
  let productImage = null;
  if (conv.productId) {
    productTitle = conv.productId.title;
    const img = await ProductImage.findOne({ productId: conv.productId._id }).sort({ order: 1 });
    productImage = img?.imageUrl || null;
  }

  return {
    id: conv._id,
    productId: conv.productId?._id || null,
    productTitle,
    productImage,
    participant: other
      ? {
          id: other._id,
          name: other.userName,
          avatar: other.UML_Image || '',
        }
      : null,
    lastMessage: conv.lastMessage,
    lastMessageAt: conv.lastMessageAt,
    lastMessageSender: conv.lastMessageSender,
    unreadCount: conv.unreadCounts?.get(currentUserId.toString()) || 0,
  };
};

// GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'userName UML_Image')
      .populate('productId', 'title')
      .sort({ lastMessageAt: -1 });

    const data = await Promise.all(
      conversations.map((conv) => formatConversation(conv, userId))
    );

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Không thể tải danh sách trò chuyện', error: err.message });
  }
};

// POST /api/chat/conversations
// body: { participantId, productId? }
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { participantId, productId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'Thiếu participantId' });
    }

    if (participantId === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể tự trò chuyện với chính mình' });
    }

    const query = {
      participants: { $all: [userId, participantId], $size: 2 },
    };
    if (productId) {
      query.productId = productId;
    } else {
      query.productId = null;
    }

    let conv = await Conversation.findOne(query)
      .populate('participants', 'userName UML_Image')
      .populate('productId', 'title');

    if (!conv) {
      conv = await Conversation.create({
        participants: [userId, participantId],
        productId: productId || null,
      });
      conv = await Conversation.findById(conv._id)
        .populate('participants', 'userName UML_Image')
        .populate('productId', 'title');
    }

    const data = await formatConversation(conv, userId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Không thể tạo cuộc trò chuyện', error: err.message });
  }
};

// GET /api/chat/conversations/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
    }
    if (!conv.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem cuộc trò chuyện này' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: { page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Không thể tải tin nhắn', error: err.message });
  }
};

// POST /api/chat/conversations/:id/messages
// body: { content }
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
    }
    if (!conv.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền gửi tin nhắn ở đây' });
    }

    const message = await Message.create({
      conversationId: id,
      senderId: userId,
      content: content.trim(),
    });

    conv.lastMessage = content.trim();
    conv.lastMessageAt = message.createdAt;
    conv.lastMessageSender = userId;

    // Tăng unreadCount cho người nhận
    conv.participants.forEach((p) => {
      const pid = p.toString();
      if (pid !== userId.toString()) {
        const current = conv.unreadCounts?.get(pid) || 0;
        conv.unreadCounts.set(pid, current + 1);
      }
    });

    await conv.save();

    // Phát realtime qua Socket.IO (nếu io đã được gắn vào app)
    const io = req.app.get('io');
    if (io) {
      conv.participants.forEach((p) => {
        io.to(`user:${p.toString()}`).emit('new_message', {
          conversationId: id,
          message,
        });
      });
    }

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Không thể gửi tin nhắn', error: err.message });
  }
};

// PUT /api/chat/conversations/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
    }
    if (!conv.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền với cuộc trò chuyện này' });
    }

    conv.unreadCounts.set(userId.toString(), 0);
    await conv.save();

    // Đọc xong -> hẹn giờ tự xóa khỏi DB sau 2 tháng (theo yêu cầu).
    const expireAt = new Date();
    expireAt.setMonth(expireAt.getMonth() + 2);

    await Message.updateMany(
      { conversationId: id, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true, expireAt } }
    );

    const io = req.app.get('io');
    if (io) {
      conv.participants.forEach((p) => {
        if (p.toString() !== userId.toString()) {
          io.to(`user:${p.toString()}`).emit('messages_read', {
            conversationId: id,
            readBy: userId,
          });
        }
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Không thể cập nhật trạng thái đã đọc', error: err.message });
  }
};
 