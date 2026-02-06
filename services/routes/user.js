// User routes: profile and update username
const express = require('express');
const { getProfile, updateUsername } = require('../controllers/userController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/update-username', auth, updateUsername);

module.exports = router;
