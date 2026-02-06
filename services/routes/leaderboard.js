// Leaderboard route: get top users
const express = require('express');
const { getTopLeaderboard } = require('../controllers/leaderboardController');
const router = express.Router();

router.get('/top', getTopLeaderboard);

module.exports = router;
