const User = require('../models/User');


const googleAuthCallback = async (req, res) => {
  try {
    

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};


const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-__v');
    res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: Date.now()
      });
    }

   
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("chatconnect.sid");
        res.json({ message: 'Logged out successfully' });
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  googleAuthCallback,
  getMe,
  logout
};
