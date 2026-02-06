// User model for Daily Quest
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  streak: { type: Number, default: 0 },
  lastPlayed: { type: Date },
  xp: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
