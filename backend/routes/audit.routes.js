const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { getAuditLogs } = require('../controllers/audit.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('admin'), asyncHandler(getAuditLogs));

module.exports = router;
