const Equipment = require('../models/Equipment');
const IssueTransaction = require('../models/IssueTransaction');
const ReturnTransaction = require('../models/ReturnTransaction');
const PracticalSubmission = require('../models/PracticalSubmission');
const Student = require('../models/Student');
const { createAuditLog } = require('../utils/auditHelper');

// @desc  Equipment inventory report data
// @route GET /api/reports/inventory
// @access Admin, Teacher
const getInventoryReport = async (req, res) => {
  const equipment = await Equipment.find().populate('addedBy', 'name').sort({ category: 1, name: 1 });
  const summary = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'Available').length,
    issued: equipment.filter(e => e.status === 'Issued').length,
    missing: equipment.filter(e => e.status === 'Missing').length,
    damaged: equipment.filter(e => e.status === 'Damaged').length,
    maintenance: equipment.filter(e => e.status === 'Maintenance').length,
  };
  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'ReportGenerated', description: 'Generated inventory report', ipAddress: req.ip });
  res.json({ success: true, report: { equipment, summary } });
};

// @desc  Issue-Return report
// @route GET /api/reports/issue-return
// @access Admin, Teacher
const getIssueReturnReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const issueQuery = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
  const returnQuery = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [issues, returns] = await Promise.all([
    IssueTransaction.find(issueQuery)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate('equipmentId', 'name equipmentId category')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 }),
    ReturnTransaction.find(returnQuery)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate('equipmentId', 'name equipmentId category')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 }),
  ]);

  res.json({ success: true, report: { issues, returns, totalIssues: issues.length, totalReturns: returns.length } });
};

// @desc  Student equipment history
// @route GET /api/reports/student/:studentId
// @access Admin, Teacher, Student
const getStudentHistory = async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).populate('userId', 'name email');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const [issues, submissions] = await Promise.all([
    IssueTransaction.find({ studentId })
      .populate('equipmentId', 'name equipmentId category')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 }),
    PracticalSubmission.find({ studentId })
      .populate('submissionQRId', 'practicalNumber experimentName subject')
      .sort({ createdAt: -1 }),
  ]);

  res.json({ success: true, report: { student, issues, submissions } });
};

// @desc  Submission report
// @route GET /api/reports/submissions
// @access Admin, Teacher
const getSubmissionReport = async (req, res) => {
  const submissions = await PracticalSubmission.find()
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
    .populate('submissionQRId', 'practicalNumber experimentName subject teacherId')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, report: { submissions, total: submissions.length } });
};

// @desc  Missing equipment report
// @route GET /api/reports/missing
// @access Admin, Teacher
const getMissingReport = async (req, res) => {
  const missing = await Equipment.find({ status: 'Missing' }).populate('addedBy', 'name');
  const overdueIssues = await IssueTransaction.find({ status: 'Overdue' })
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
    .populate('equipmentId', 'name equipmentId category')
    .populate('teacherId', 'name');
  res.json({ success: true, report: { missing, overdueIssues } });
};

module.exports = { getInventoryReport, getIssueReturnReport, getStudentHistory, getSubmissionReport, getMissingReport };
