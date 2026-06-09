const Equipment = require('../models/Equipment');
const Student = require('../models/Student');
const User = require('../models/User');
const IssueTransaction = require('../models/IssueTransaction');
const ReturnTransaction = require('../models/ReturnTransaction');
const PracticalSubmission = require('../models/PracticalSubmission');

// @desc  Get dashboard stats
// @route GET /api/dashboard/stats
// @access Admin, Teacher
const getDashboardStats = async (req, res) => {
  const [
    totalEquipment, availableEquipment, issuedEquipment, missingEquipment, damagedEquipment,
    totalStudents, totalTeachers, totalSubmissions,
    pendingSubmissions, overdueIssues,
  ] = await Promise.all([
    Equipment.countDocuments(),
    Equipment.countDocuments({ status: 'Available' }),
    Equipment.countDocuments({ status: 'Issued' }),
    Equipment.countDocuments({ status: 'Missing' }),
    Equipment.countDocuments({ status: 'Damaged' }),
    Student.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    PracticalSubmission.countDocuments(),
    PracticalSubmission.countDocuments({ verificationStatus: 'Pending' }),
    IssueTransaction.countDocuments({ status: 'Overdue' }),
  ]);

  res.json({
    success: true,
    stats: {
      totalEquipment, availableEquipment, issuedEquipment, missingEquipment, damagedEquipment,
      totalStudents, totalTeachers, totalSubmissions, pendingSubmissions, overdueIssues,
    },
  });
};

// @desc  Get daily issue/return chart data (last 7 days)
// @route GET /api/dashboard/charts
// @access Admin, Teacher
const getChartData = async (req, res) => {
  const days = 7;
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Daily issues
  const issueData = await IssueTransaction.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Daily returns
  const returnData = await ReturnTransaction.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Equipment utilization by category
  const equipmentByCategory = await Equipment.aggregate([
    { $group: { _id: '$category', total: { $sum: 1 }, issued: { $sum: { $cond: [{ $eq: ['$status', 'Issued'] }, 1, 0] } } } },
  ]);

  // Submission stats by status
  const submissionStats = await PracticalSubmission.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
  ]);

  // Most issued equipment (top 5)
  const topEquipment = await IssueTransaction.aggregate([
    { $group: { _id: '$equipmentId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'equipment', localField: '_id', foreignField: '_id', as: 'equipment' } },
    { $unwind: '$equipment' },
    { $project: { name: '$equipment.name', count: 1, category: '$equipment.category' } },
  ]);

  res.json({
    success: true,
    charts: {
      issueData,
      returnData,
      equipmentByCategory,
      submissionStats,
      topEquipment,
    },
  });
};

// @desc  Recent activity feed
// @route GET /api/dashboard/activity
// @access Admin, Teacher
const getRecentActivity = async (req, res) => {
  const recentIssues = await IssueTransaction.find({ status: 'Issued' })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .populate('equipmentId', 'name equipmentId')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentReturns = await ReturnTransaction.find()
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .populate('equipmentId', 'name equipmentId')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentSubmissions = await PracticalSubmission.find()
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({ success: true, recentIssues, recentReturns, recentSubmissions });
};

module.exports = { getDashboardStats, getChartData, getRecentActivity };
