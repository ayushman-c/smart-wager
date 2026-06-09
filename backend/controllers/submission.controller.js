const PracticalSubmission = require('../models/PracticalSubmission');
const SubmissionQR = require('../models/SubmissionQR');
const Student = require('../models/Student');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../utils/auditHelper');
const { createNotification } = require('../utils/notificationHelper');

// @desc  Teacher generates a Submission QR
// @route POST /api/submissions/qr
// @access Teacher, Admin
const generateSubmissionQR = async (req, res) => {
  const { practicalNumber, experimentName, subject, semester, section, department, deadline, maxSubmissions, description } = req.body;
  const qrId = `SQR-${uuidv4().slice(0, 8).toUpperCase()}`;

  const submissionQR = await SubmissionQR.create({
    qrId, practicalNumber, experimentName, subject,
    teacherId: req.user._id,
    semester, section, department, deadline, maxSubmissions, description,
  });

  const qrPayload = JSON.stringify({ type: 'submission', qrId, _id: submissionQR._id.toString() });
  const qrCodeBase64 = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', width: 300 });

  submissionQR.qrCode = qrCodeBase64;
  submissionQR.qrData = qrPayload;
  await submissionQR.save();

  await createAuditLog({
    userId: req.user._id, userName: req.user.name, userRole: req.user.role,
    action: 'QRGenerated', description: `Submission QR for Practical ${practicalNumber}: ${experimentName}`,
    ipAddress: req.ip, relatedId: submissionQR._id, relatedModel: 'SubmissionQR',
  });

  res.status(201).json({ success: true, submissionQR });
};

// @desc  Student submits practical work after scanning QR
// @route POST /api/submissions
// @access Student
const submitPractical = async (req, res) => {
  const { qrId, remarks } = req.body;

  const submissionQR = await SubmissionQR.findOne({ qrId });
  if (!submissionQR) return res.status(404).json({ success: false, message: 'Invalid or expired submission QR code' });
  if (!submissionQR.isActive) return res.status(400).json({ success: false, message: 'This submission QR is no longer active' });

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return res.status(403).json({ success: false, message: 'Only students can submit practicals' });

  // Check for duplicate submission
  const existing = await PracticalSubmission.findOne({ submissionQRId: submissionQR._id, studentId: student._id });
  if (existing) return res.status(400).json({ success: false, message: 'You have already submitted for this practical' });

  const isLate = submissionQR.deadline ? new Date() > submissionQR.deadline : false;
  const images = req.files?.images ? req.files.images.map(f => f.path) : [];
  const pdfReport = req.files?.pdf?.[0]?.path || null;

  const submission = await PracticalSubmission.create({
    submissionQRId: submissionQR._id,
    studentId: student._id,
    practicalNumber: submissionQR.practicalNumber,
    experimentName: submissionQR.experimentName,
    subject: submissionQR.subject,
    images, pdfReport, remarks, isLate,
  });

  await createNotification({
    title: 'New Practical Submission',
    message: `Student submitted Practical ${submissionQR.practicalNumber}: ${submissionQR.experimentName}`,
    type: 'PendingVerification',
    severity: 'info',
    recipientId: submissionQR.teacherId,
    relatedId: submission._id,
    relatedModel: 'PracticalSubmission',
  });

  await createAuditLog({
    userId: req.user._id, userName: req.user.name, userRole: req.user.role,
    action: 'SubmissionUploaded', description: `Submitted Practical ${submissionQR.practicalNumber}`,
    ipAddress: req.ip, relatedId: submission._id, relatedModel: 'PracticalSubmission',
  });

  res.status(201).json({ success: true, submission });
};

// @desc  Get all submissions (teacher/admin)
// @route GET /api/submissions
// @access Teacher, Admin
const getSubmissions = async (req, res) => {
  const { status, page = 1, limit = 20, studentId, qrId } = req.query;
  const query = {};
  if (status) query.verificationStatus = status;
  if (studentId) query.studentId = studentId;

  if (qrId) {
    const qr = await SubmissionQR.findOne({ qrId });
    if (qr) query.submissionQRId = qr._id;
  }

  // If teacher, only show submissions for their QRs
  if (req.user.role === 'teacher') {
    const teacherQRs = await SubmissionQR.find({ teacherId: req.user._id }).select('_id');
    query.submissionQRId = { $in: teacherQRs.map(q => q._id) };
  }

  const total = await PracticalSubmission.countDocuments(query);
  const submissions = await PracticalSubmission.find(query)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
    .populate('submissionQRId', 'practicalNumber experimentName subject deadline teacherId')
    .populate('reviewedBy', 'name')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ success: true, count: submissions.length, total, page: Number(page), submissions });
};

// @desc  Get student's own submissions
// @route GET /api/submissions/my
// @access Student
const getMySubmissions = async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
  const submissions = await PracticalSubmission.find({ studentId: student._id })
    .populate('submissionQRId', 'practicalNumber experimentName subject deadline')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, submissions });
};

// @desc  Teacher reviews a submission
// @route PATCH /api/submissions/:id/review
// @access Teacher, Admin
const reviewSubmission = async (req, res) => {
  const { verificationStatus, teacherFeedback, marks } = req.body;
  const submission = await PracticalSubmission.findByIdAndUpdate(
    req.params.id,
    { verificationStatus, teacherFeedback, marks, reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  ).populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

  const action = verificationStatus === 'Approved' ? 'SubmissionApproved' : 'SubmissionRejected';
  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action, description: `${verificationStatus} submission ${req.params.id}`, ipAddress: req.ip });

  res.json({ success: true, submission });
};

// @desc  Get all submission QRs by teacher
// @route GET /api/submissions/qr
// @access Teacher, Admin
const getSubmissionQRs = async (req, res) => {
  const query = req.user.role === 'teacher' ? { teacherId: req.user._id } : {};
  const qrs = await SubmissionQR.find(query).populate('teacherId', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, qrs });
};

// @desc  Deactivate a submission QR
// @route PATCH /api/submissions/qr/:id/toggle
// @access Teacher, Admin
const toggleSubmissionQR = async (req, res) => {
  const qr = await SubmissionQR.findById(req.params.id);
  if (!qr) return res.status(404).json({ success: false, message: 'QR not found' });
  qr.isActive = !qr.isActive;
  await qr.save();
  res.json({ success: true, qr });
};

// @desc  Scan submission QR data (lookup)
// @route POST /api/submissions/scan
// @access Student
const scanSubmissionQR = async (req, res) => {
  const { qrData } = req.body;
  let parsed;
  try { parsed = JSON.parse(qrData); } catch { return res.status(400).json({ success: false, message: 'Invalid QR data' }); }
  const qr = await SubmissionQR.findOne({ qrId: parsed.qrId }).populate('teacherId', 'name');
  if (!qr) return res.status(404).json({ success: false, message: 'Submission QR not found' });
  if (!qr.isActive) return res.status(400).json({ success: false, message: 'This submission QR is no longer active' });
  res.json({ success: true, submissionQR: qr });
};

module.exports = { generateSubmissionQR, submitPractical, getSubmissions, getMySubmissions, reviewSubmission, getSubmissionQRs, toggleSubmissionQR, scanSubmissionQR };
