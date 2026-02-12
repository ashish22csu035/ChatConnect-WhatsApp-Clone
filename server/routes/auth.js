const express = require('express');
const passport = require('passport');
const { googleAuthCallback, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Initiate Google OAuth
// @route   GET /api/auth/google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: true
  }),
  googleAuthCallback   // 🔥 THIS WAS MISSING
);


// @desc    Get current logged-in user
// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @desc    Logout user
// @route   POST /api/auth/logout
router.post('/logout', protect, logout);

module.exports = router;