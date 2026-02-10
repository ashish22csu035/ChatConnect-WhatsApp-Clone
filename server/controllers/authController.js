const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const googleAuthCallback = async (req, res) => {
  try {
    if (!req.user) {
      console.error('❌ No user in request');
      return res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
    }

    const token = generateToken(req.user._id);
    console.log('✅ Generated token for user:', req.user.email);

    // ✅ CHANGED: Send token in URL instead of cookie
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('❌ Auth callback error:', error);
    return res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
  }
};

const getMe = async (req, res) => {
  try {
    console.log('✅ Getting user info for:', req.user._id);
    const user = await User.findById(req.user._id).select('-__v');
    res.json(user);
  } catch (error) {
    console.error('❌ Error in getMe:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    console.log('🚪 Logging out user:', req.user?._id);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  googleAuthCallback,
  getMe,
  logout
};