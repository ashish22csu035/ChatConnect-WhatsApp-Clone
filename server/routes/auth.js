const express = require('express');
const passport = require('passport');
const { googleAuthCallback, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleAuthCallback
);


router.get('/me', protect, getMe);


router.post('/logout', protect, logout);

module.exports = router;