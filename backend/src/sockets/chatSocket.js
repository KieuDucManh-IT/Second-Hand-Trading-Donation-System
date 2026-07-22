const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
 
const User         = require('../models/modelUser');
const Conversation = require('../models/modelConversation');
const Message      = require('../models/modelMessage');
const { containsProfanity } = require('../utils/profanityFilter');
 
const MAX_MESSAGE_LENGTH = 2000;
 
const onlineUsers = new Map();
 
const markUserOnline = (io, userId) => {
  const count = onlineUsers.get(userId) || 0;
  onlineUsers.set(userId, count + 1);
  if (count === 0) {
    io.emit('user_online', { userId });
  }
};
 
const markUserOffline = (io, userId) => {
  const count = onlineUsers.get(userId) || 0;
  if (count <= 1) {
    onlineUsers.delete(userId);
    io.emit('user_offline', { userId });
  } else {
    onlineUsers.set(userId, count - 1);
  }
};
 

const initChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });
 
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
 
      if (!token) {
        return next(new Error('Không có token xác thực'));
      }
 
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
 
      if (!user) {
        return next(new Error('Tài khoản không tồn tại'));
      }
 
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Token không hợp lệ hoặc đã hết hạn'));
    }
  });
 
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
 
    socket.join(`user:${userId}`);
 
    markUserOnline(io, userId);
 
    socket.on('get_online_status', (userIds = [], callback) => {
      const result = {};
      (Array.isArray(userIds) ? userIds : [userIds]).forEach((id) => {
        result[id] = onlineUsers.has(id);
      });
      if (typeof callback === 'function') callback(result);
    });
 
    socket.on('join_conversation', async (conversationId) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        const isParticipant = conv.participants.some((p) => p.toString() === userId);
        if (!isParticipant) return;
 
        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        socket.emit('error_message', { message: 'Không thể tham gia cuộc trò chuyện' });
      }
    });
 
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });
 
    socket.on('send_message', async ({ conversationId, content }, callback) => {
      const ack = typeof callback === 'function' ? callback : () => {};

      try {
        const trimmed = (content || '').trim();

        if (!trimmed) {
          return ack({ success: false, message: 'Nội dung tin nhắn không được để trống' });
        }

        if (trimmed.length > MAX_MESSAGE_LENGTH) {
          const errMsg = `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LENGTH} ký tự)`;
          socket.emit('error_message', { message: errMsg });
          return ack({ success: false, message: errMsg });
        }

        if (containsProfanity(trimmed)) {
          const errMsg = 'Tin nhắn chứa từ ngữ không phù hợp, vui lòng chỉnh sửa lại nội dung';
          socket.emit('error_message', { message: errMsg });
          return ack({ success: false, message: errMsg });
        }

        const conv = await Conversation.findById(conversationId)
          .populate('participants', 'fullName avatar');
        if (!conv) {
          socket.emit('error_message', { message: 'Không tìm thấy cuộc trò chuyện' });
          return ack({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
        }
        const isParticipant = conv.participants.some((p) => p._id.toString() === userId);
        if (!isParticipant) {
          const errMsg = 'Bạn không có quyền gửi tin nhắn ở đây';
          socket.emit('error_message', { message: errMsg });
          return ack({ success: false, message: errMsg });
        }

        const message = await Message.create({
          conversationId,
          senderId: userId,
          content: trimmed,
        });

        conv.lastMessage = trimmed;
        conv.lastMessageAt = message.createdAt;
        conv.lastMessageSender = userId;

        conv.participants.forEach((p) => {
          const pid = p._id.toString();
          if (pid !== userId) {
            const current = conv.unreadCounts?.get(pid) || 0;
            conv.unreadCounts.set(pid, current + 1);
          }
        });

        await conv.save();

        conv.participants.forEach((p) => {
          const receiverId = p._id.toString();
          const otherParticipant = conv.participants.find(
            (op) => op._id.toString() !== receiverId
          );
          const participantInfo = otherParticipant
            ? { id: otherParticipant._id, name: otherParticipant.fullName || otherParticipant.userName || '', avatar: otherParticipant.avatar || '' }
            : null;

          io.to(`user:${receiverId}`).emit('new_message', {
            conversationId,
            message,
            participant: participantInfo,
          });
        });

        ack({ success: true, data: message });
      } catch (err) {
        socket.emit('error_message', { message: 'Không thể gửi tin nhắn', error: err.message });
        ack({ success: false, message: 'Không thể gửi tin nhắn' });
      }
    });
 
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: !!isTyping,
      });
    });
 
    socket.on('mark_as_read', async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        const isParticipant = conv.participants.some((p) => p.toString() === userId);
        if (!isParticipant) return;
 
        conv.unreadCounts.set(userId, 0);
        await conv.save();
 
        const expireAt = new Date();
        expireAt.setMonth(expireAt.getMonth() + 2);
 
        await Message.updateMany(
          { conversationId, senderId: { $ne: userId }, isRead: false },
          { $set: { isRead: true, expireAt } }
        );
 
        conv.participants.forEach((p) => {
          if (p.toString() !== userId) {
            io.to(`user:${p.toString()}`).emit('messages_read', {
              conversationId,
              readBy: userId,
            });
          }
        });
      } catch (err) {
        socket.emit('error_message', { message: 'Không thể cập nhật trạng thái đã đọc' });
      }
    });
 
    socket.on('disconnect', () => {
      markUserOffline(io, userId);
    });
  });
 
  return io;
};
 
module.exports = { initChatSocket };