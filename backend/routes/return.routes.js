const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { returnEquipment, getReturnTransactions } = require('../controllers/return.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('admin', 'teacher'), asyncHandler(returnEquipment));
router.get('/', authorize('admin', 'teacher'), asyncHandler(getReturnTransactions));

module.exports = router;
