const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const googleAuthCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    // ✅ Set cookie for cross-site (Vercel <-> Render)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // ✅ Redirect to frontend dashboard
    return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error('Auth callback error:', error);
    return res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
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
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(0),
    path: '/',
  });

  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  googleAuthCallback,
  getMe,
  logout
};
