const AuditLog = require('../models/AuditLog');

// @desc  Get audit logs
// @route GET /api/audit
// @access Admin
const getAuditLogs = async (req, res) => {
  const { action, userId, page = 1, limit = 50, startDate, endDate } = req.query;
  const query = {};
  if (action) query.action = action;
  if (userId) query.userId = userId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, count: logs.length, total, page: Number(page), logs });
};

module.exports = { getAuditLogs };
