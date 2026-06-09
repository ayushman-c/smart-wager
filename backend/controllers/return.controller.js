const ReturnTransaction = require('../models/ReturnTransaction');
const IssueTransaction = require('../models/IssueTransaction');
const Equipment = require('../models/Equipment');
const { createAuditLog } = require('../utils/auditHelper');
const { createNotification } = require('../utils/notificationHelper');

// @desc  Return equipment
// @route POST /api/return
// @access Teacher, Admin
const returnEquipment = async (req, res) => {
  const { issueTransactionId, condition, remarks, quantity } = req.body;

  const issueTransaction = await IssueTransaction.findById(issueTransactionId);
  if (!issueTransaction) return res.status(404).json({ success: false, message: 'Issue transaction not found' });
  if (issueTransaction.status === 'Returned') {
    return res.status(400).json({ success: false, message: 'Equipment already returned' });
  }

  const returnQty = quantity || issueTransaction.quantity;
  const returnDate = new Date();
  const isOverdue = issueTransaction.expectedReturnDate && returnDate > issueTransaction.expectedReturnDate;
  const overdueDays = isOverdue
    ? Math.ceil((returnDate - issueTransaction.expectedReturnDate) / (1000 * 60 * 60 * 24))
    : 0;

  const returnTransaction = await ReturnTransaction.create({
    issueTransactionId,
    studentId: issueTransaction.studentId,
    equipmentId: issueTransaction.equipmentId,
    teacherId: req.user._id,
    returnDate,
    condition,
    remarks,
    isOverdue,
    overdueDays,
    quantity: returnQty,
  });

  // Update issue transaction
  issueTransaction.status = 'Returned';
  await issueTransaction.save();

  // Update equipment
  const equipment = await Equipment.findById(issueTransaction.equipmentId);
  if (equipment) {
    equipment.availableQuantity += returnQty;
    if (condition === 'Damaged') {
      equipment.status = 'Damaged';
      await createNotification({
        title: 'Equipment Damaged',
        message: `${equipment.name} (${equipment.equipmentId}) returned in damaged condition. ${remarks || ''}`,
        type: 'DamagedEquipment',
        severity: 'error',
        recipientRole: 'admin',
        relatedId: equipment._id,
        relatedModel: 'Equipment',
      });
    } else if (condition === 'Needs Maintenance') {
      equipment.status = 'Maintenance';
    } else {
      if (equipment.availableQuantity >= equipment.quantity) equipment.status = 'Available';
    }
    await equipment.save();
  }

  if (isOverdue) {
    await createNotification({
      title: 'Late Return',
      message: `Equipment returned ${overdueDays} day(s) late.`,
      type: 'LateReturn',
      severity: 'warning',
      recipientRole: 'admin',
      relatedId: returnTransaction._id,
      relatedModel: 'ReturnTransaction',
    });
  }

  await createAuditLog({
    userId: req.user._id, userName: req.user.name, userRole: req.user.role,
    action: 'EquipmentReturned',
    description: `Returned equipment for transaction ${issueTransactionId}`,
    ipAddress: req.ip, relatedId: returnTransaction._id, relatedModel: 'ReturnTransaction',
  });

  const populated = await returnTransaction.populate([
    { path: 'studentId', populate: { path: 'userId', select: 'name email' } },
    { path: 'equipmentId', select: 'name equipmentId category' },
    { path: 'teacherId', select: 'name email' },
  ]);

  res.status(201).json({ success: true, returnTransaction: populated });
};

// @desc  Get all return transactions
// @route GET /api/return
// @access Admin, Teacher
const getReturnTransactions = async (req, res) => {
  const { page = 1, limit = 20, studentId, equipmentId } = req.query;
  const query = {};
  if (studentId) query.studentId = studentId;
  if (equipmentId) query.equipmentId = equipmentId;

  const total = await ReturnTransaction.countDocuments(query);
  const transactions = await ReturnTransaction.find(query)
    .populate([
      { path: 'studentId', populate: { path: 'userId', select: 'name email' } },
      { path: 'equipmentId', select: 'name equipmentId category' },
      { path: 'teacherId', select: 'name email' },
      { path: 'issueTransactionId', select: 'issueDate transactionId' },
    ])
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ success: true, count: transactions.length, total, page: Number(page), transactions });
};

module.exports = { returnEquipment, getReturnTransactions };
