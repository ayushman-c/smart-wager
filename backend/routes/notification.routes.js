const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', asyncHandler(getNotifications));
router.patch('/read-all', asyncHandler(markAllRead));
router.patch('/:id/read', asyncHandler(markRead));
router.delete('/:id', authorize('admin'), asyncHandler(deleteNotification));

module.exports = router;
