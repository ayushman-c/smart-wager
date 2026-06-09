const Notification = require('../models/Notification');

// @desc  Get notifications for current user
// @route GET /api/notifications
// @access Private
const getNotifications = async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = {
    $or: [
      { recipientId: req.user._id },
      { recipientRole: req.user.role },
      { recipientRole: 'all' },
    ],
  };
  if (unreadOnly === 'true') query.isRead = false;

  const total = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

  res.json({ success: true, count: notifications.length, total, unreadCount, page: Number(page), notifications });
};

// @desc  Mark notification as read
// @route PATCH /api/notifications/:id/read
// @access Private
const markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true, message: 'Notification marked as read' });
};

// @desc  Mark all notifications as read
// @route PATCH /api/notifications/read-all
// @access Private
const markAllRead = async (req, res) => {
  await Notification.updateMany(
    {
      $or: [{ recipientId: req.user._id }, { recipientRole: req.user.role }, { recipientRole: 'all' }],
      isRead: false,
    },
    { isRead: true }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
};

// @desc  Delete notification
// @route DELETE /api/notifications/:id
// @access Admin
const deleteNotification = async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
