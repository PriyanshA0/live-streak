// Game controller: handle daily challenge completion and status
const User = require('../models/User');

const LOCK_WINDOW_MS = 20 * 60 * 60 * 1000; // 20 hours
const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_GOAL = 100;

const stripTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function diffInCalendarDays(last, current) {
  const start = stripTime(last);
  const end = stripTime(current);
  return Math.round((end - start) / DAY_MS);
}

function getUnlockMeta(lastPlayed) {
  if (!lastPlayed) {
    return { canPlay: true, unlocksIn: 0, nextUnlockAt: null };
  }
  const lastTs = new Date(lastPlayed).getTime();
  const nextUnlockAt = lastTs + LOCK_WINDOW_MS;
  const now = Date.now();
  if (now >= nextUnlockAt) {
    return { canPlay: true, unlocksIn: 0, nextUnlockAt };
  }
  return { canPlay: false, unlocksIn: nextUnlockAt - now, nextUnlockAt };
}

exports.completeGame = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const unlockMeta = getUnlockMeta(user.lastPlayed);
    if (!unlockMeta.canPlay) {
      return res.status(400).json({
        message: 'Next challenge unlocks in 20 hours',
        unlocksIn: unlockMeta.unlocksIn,
        nextUnlockAt: unlockMeta.nextUnlockAt,
      });
    }

    const now = new Date();
    let streak = user.streak || 0;
    if (!user.lastPlayed) {
      streak = 1;
    } else {
      const last = new Date(user.lastPlayed);
      const diffDays = diffInCalendarDays(last, now);
      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      }
      // If diffDays is 0 we completed the same calendar day; allow XP but no streak bump
      if (streak === 0) streak = 1;
    }

    user.streak = Math.min(streak, STREAK_GOAL);
    user.lastPlayed = now;
    user.xp += 10;
    await user.save();

    res.json({
      streak: user.streak,
      xp: user.xp,
      streakGoal: STREAK_GOAL,
      nextUnlockIn: LOCK_WINDOW_MS,
      nextUnlockAt: now.getTime() + LOCK_WINDOW_MS,
    });
  } catch (err) {
    res.status(500).json({ message: 'Game completion error' });
  }
};

exports.getGameStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const unlockMeta = getUnlockMeta(user.lastPlayed);
    res.json({
      canPlay: unlockMeta.canPlay,
      unlocksIn: unlockMeta.unlocksIn,
      nextUnlockAt: unlockMeta.nextUnlockAt,
      streak: user.streak,
      xp: user.xp,
      streakGoal: STREAK_GOAL,
    });
  } catch (err) {
    res.status(500).json({ message: 'Status fetch error' });
  }
};
