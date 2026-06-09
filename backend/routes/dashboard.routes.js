const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { getDashboardStats, getChartData, getRecentActivity } = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/stats', authorize('admin', 'teacher'), asyncHandler(getDashboardStats));
router.get('/charts', authorize('admin', 'teacher'), asyncHandler(getChartData));
router.get('/activity', authorize('admin', 'teacher'), asyncHandler(getRecentActivity));

module.exports = router;
