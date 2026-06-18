const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const User         = require('../models/modelUser');
const Conversation = require('../models/modelConversation');
const Message      = require('../models/modelMessage');

/**
 * Khởi tạo Socket.IO, gắn middleware xác thực JWT và đăng ký các event chat.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // ── Middleware xác thực: client gửi token qua socket.handshake.auth.token ──
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

    // Mỗi user có 1 room riêng -> server có thể emit tới mọi tab/thiết bị của user đó
    socket.join(`user:${userId}`);

    // ── Tham gia phòng của một cuộc trò chuyện cụ thể ──────────────────────
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

    // ── Gửi tin nhắn realtime ───────────────────────────────────────────────
    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const conv = await Conversation.findById(conversationId);
        if (!conv) {
          return socket.emit('error_message', { message: 'Không tìm thấy cuộc trò chuyện' });
        }
        const isParticipant = conv.participants.some((p) => p.toString() === userId);
        if (!isParticipant) {
          return socket.emit('error_message', { message: 'Bạn không có quyền gửi tin nhắn ở đây' });
        }

        const message = await Message.create({
          conversationId,
          senderId: userId,
          content: content.trim(),
        });

        conv.lastMessage = content.trim();
        conv.lastMessageAt = message.createdAt;
        conv.lastMessageSender = userId;

        conv.participants.forEach((p) => {
          const pid = p.toString();
          if (pid !== userId) {
            const current = conv.unreadCounts?.get(pid) || 0;
            conv.unreadCounts.set(pid, current + 1);
          }
        });

        await conv.save();

        // Gửi cho tất cả participant (kể cả các tab khác của chính người gửi)
        conv.participants.forEach((p) => {
          io.to(`user:${p.toString()}`).emit('new_message', {
            conversationId,
            message,
          });
        });
      } catch (err) {
        socket.emit('error_message', { message: 'Không thể gửi tin nhắn', error: err.message });
      }
    });

    // ── Trạng thái đang nhập ─────────────────────────────────────────────────
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: !!isTyping,
      });
    });

    // ── Đánh dấu đã đọc ───────────────────────────────────────────────────────
    socket.on('mark_as_read', async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        const isParticipant = conv.participants.some((p) => p.toString() === userId);
        if (!isParticipant) return;

        conv.unreadCounts.set(userId, 0);
        await conv.save();

        await Message.updateMany(
          { conversationId, senderId: { $ne: userId }, isRead: false },
          { $set: { isRead: true } }
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
      // có thể broadcast trạng thái offline nếu cần
    });
  });

  return io;
};

module.exports = { initChatSocket };
