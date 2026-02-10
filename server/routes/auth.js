const express = require('express');
const passport = require('passport');
const { googleAuthCallback, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Start Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/auth/failed'
  }),
  googleAuthCallback
);

// Optional failure route (just for safety/debug)
router.get('/failed', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
});

// Get current user
router.get('/me', protect, getMe);

// Logout
router.post('/logout', protect, logout);

module.exports = router;
