const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { decodeQR, generateQR } = require('../controllers/qr.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/decode', asyncHandler(decodeQR));
router.post('/generate', authorize('admin', 'teacher'), asyncHandler(generateQR));

module.exports = router;
