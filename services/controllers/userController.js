// User controller: profile and update username
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Profile fetch error' });
  }
};

exports.updateUsername = async (req, res) => {
  const { username } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username taken' });
    const user = await User.findByIdAndUpdate(req.user.id, { username }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Update error' });
  }
};
