const IssueTransaction = require('../models/IssueTransaction');
const Equipment = require('../models/Equipment');
const Student = require('../models/Student');
const { createAuditLog } = require('../utils/auditHelper');
const { createNotification } = require('../utils/notificationHelper');
const { v4: uuidv4 } = require('uuid');

// @desc  Issue equipment to student
// @route POST /api/issue
// @access Teacher, Admin
const issueEquipment = async (req, res) => {
  const { studentId, equipmentId, expectedReturnDate, notes, quantity = 1 } = req.body;

  const equipment = await Equipment.findById(equipmentId);
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
  if (equipment.availableQuantity < quantity) {
    return res.status(400).json({ success: false, message: `Only ${equipment.availableQuantity} unit(s) available` });
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const transaction = await IssueTransaction.create({
    transactionId: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
    studentId, equipmentId,
    teacherId: req.user._id,
    issueDate: new Date(),
    expectedReturnDate: expectedReturnDate || null,
    notes, quantity,
  });

  // Update equipment availability
  equipment.availableQuantity -= quantity;
  if (equipment.availableQuantity === 0) equipment.status = 'Issued';
  await equipment.save();

  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'EquipmentIssued', description: `Issued ${equipment.name} to student ${studentId}`, ipAddress: req.ip, relatedId: transaction._id, relatedModel: 'IssueTransaction' });

  const populated = await transaction.populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email' } },
    { path: 'equipmentId', select: 'name equipmentId category' },
    { path: 'teacherId', select: 'name email' },
  ]);

  res.status(201).json({ success: true, transaction: populated });
};

// @desc  Get all issue transactions
// @route GET /api/issue
// @access Admin, Teacher
const getIssueTransactions = async (req, res) => {
  const { status, studentId, equipmentId, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (studentId) query.studentId = studentId;
  if (equipmentId) query.equipmentId = equipmentId;

  const total = await IssueTransaction.countDocuments(query);
  const transactions = await IssueTransaction.find(query)
    .populate([
      { path: 'studentId', populate: { path: 'userId', select: 'name email' } },
      { path: 'equipmentId', select: 'name equipmentId category status' },
      { path: 'teacherId', select: 'name email' },
    ])
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ success: true, count: transactions.length, total, page: Number(page), transactions });
};

// @desc  Get single issue transaction
// @route GET /api/issue/:id
// @access Admin, Teacher
const getIssueTransaction = async (req, res) => {
  const transaction = await IssueTransaction.findById(req.params.id).populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email' } },
    { path: 'equipmentId' },
    { path: 'teacherId', select: 'name email' },
  ]);
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
  res.json({ success: true, transaction });
};

// @desc  Get active issues for a student
// @route GET /api/issue/student/:studentId
// @access Admin, Teacher, Student
const getStudentIssues = async (req, res) => {
  const transactions = await IssueTransaction.find({
    studentId: req.params.studentId,
    status: 'Issued',
  }).populate('equipmentId', 'name equipmentId category status image');
  res.json({ success: true, transactions });
};

// @desc  Mark overdue transactions
// @route PATCH /api/issue/check-overdue
// @access Admin
const checkOverdue = async (req, res) => {
  const now = new Date();
  const result = await IssueTransaction.updateMany(
    { status: 'Issued', expectedReturnDate: { $lt: now } },
    { $set: { status: 'Overdue' } }
  );
  res.json({ success: true, updated: result.modifiedCount });
};

module.exports = { issueEquipment, getIssueTransactions, getIssueTransaction, getStudentIssues, checkOverdue };
