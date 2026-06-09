const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { register, login, getMe, updatePassword, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));
router.put('/password', protect, asyncHandler(updatePassword));
router.post('/logout', protect, asyncHandler(logout));

module.exports = router;
