const express = require('express');
const router  = express.Router();

const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/chatController');

const { protect } = require('../middlewares/authMiddleware');

// Tất cả route chat đều cần đăng nhập
router.use(protect);

router.get('/conversations',                getConversations);
router.post('/conversations',               getOrCreateConversation);
router.get('/conversations/:id/messages',   getMessages);
router.post('/conversations/:id/messages',  sendMessage);
router.put('/conversations/:id/read',       markAsRead);

module.exports = router;
