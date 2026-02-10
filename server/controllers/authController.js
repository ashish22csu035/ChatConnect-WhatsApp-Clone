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

    // Set cookie with proper cross-origin settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    console.log('✅ Cookie set, redirecting to:', `${process.env.CLIENT_URL}/dashboard`);

    // Redirect to frontend dashboard
    return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
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
    
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(0),
      path: '/',
    });

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