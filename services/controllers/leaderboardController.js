// Leaderboard controller: get top users by streak and XP
const User = require('../models/User');

exports.getTopLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ streak: -1, xp: -1 }).limit(10).select('username streak xp');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Leaderboard fetch error' });
  }
};
