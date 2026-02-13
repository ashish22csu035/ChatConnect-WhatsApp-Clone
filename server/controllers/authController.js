const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Google OAuth callback
const googleAuthCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    //  Send token via URL (NO COOKIE)
    res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  googleAuthCallback,
  getMe,
  logout
};
