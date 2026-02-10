const express = require('express');
const {
  getUsers,
  getMessages,
  sendMessage,
  markAsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.use(protect);


router.get('/users', getUsers);


router.get('/messages/:userId', getMessages);


router.post('/messages', sendMessage);


router.put('/messages/read/:userId', markAsRead);

module.exports = router;