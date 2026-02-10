const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // ✅ CHANGED: Get token from Authorization header instead of cookies
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token found in Authorization header');
    }

    if (!token) {
      console.log('❌ No token found in Authorization header');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    console.log('✅ Token:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded, user ID:', decoded.id);

    const user = await User.findById(decoded.id).select('-__v');

    if (!user) {
      console.log('❌ User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };