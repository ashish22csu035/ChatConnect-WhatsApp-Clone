const express = require('express');
const {
  getUsers,
  getMessages,
  sendMessage,
  markAsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all users
// @route   GET /api/chat/users
router.get('/users', getUsers);

// @desc    Get messages with a specific user
// @route   GET /api/chat/messages/:userId
router.get('/messages/:userId', getMessages);

// @desc    Send a message
// @route   POST /api/chat/messages
router.post('/messages', sendMessage);

// @desc    Mark messages as read
// @route   PUT /api/chat/messages/read/:userId
router.put('/messages/read/:userId', markAsRead);

module.exports = router;