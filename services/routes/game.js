// Game progress routes
const express = require('express');
const { completeGame, getGameStatus } = require('../controllers/gameController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/complete', auth, completeGame);
router.get('/status', auth, getGameStatus);

module.exports = router;
