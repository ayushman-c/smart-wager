const Student = require('../models/Student');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditHelper');

// @desc  Get all students
// @route GET /api/students
// @access Admin, Teacher
const getStudents = async (req, res) => {
  const { search, department, semester, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);

  let studentIds = null;
  if (search) {
    const users = await User.find({ name: { $regex: search, $options: 'i' }, role: 'student' }).select('_id');
    const userIds = users.map(u => u._id);
    query.$or = [
      { rollNumber: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
      { userId: { $in: userIds } },
    ];
  }

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .populate('userId', 'name email contactNumber')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ success: true, count: students.length, total, page: Number(page), students });
};

// @desc  Get single student
// @route GET /api/students/:id
// @access Admin, Teacher
const getStudent = async (req, res) => {
  const student = await Student.findById(req.params.id).populate('userId', 'name email contactNumber');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, student });
};

// @desc  Create student (also creates user account)
// @route POST /api/students
// @access Admin, Teacher
const createStudent = async (req, res) => {
  const {
    name, email, password, rollNumber, registrationNumber,
    department, semester, section, batch, contactNumber,
    guardianName, guardianContact, address,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

  const existingStudent = await Student.findOne({ $or: [{ rollNumber }, { registrationNumber }] });
  if (existingStudent) return res.status(400).json({ success: false, message: 'Roll number or registration number already exists' });

  const user = await User.create({ name, email, password: password || rollNumber, role: 'student', department, contactNumber });
  const student = await Student.create({
    userId: user._id, rollNumber, registrationNumber, department, semester,
    section, batch, contactNumber, guardianName, guardianContact, address,
  });

  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'StudentAdded', description: `Added student: ${name}`, ipAddress: req.ip, relatedId: student._id, relatedModel: 'Student' });
  res.status(201).json({ success: true, student: await student.populate('userId', 'name email contactNumber') });
};

// @desc  Update student
// @route PUT /api/students/:id
// @access Admin, Teacher
const updateStudent = async (req, res) => {
  const { name, email, rollNumber, registrationNumber, department, semester, section, batch, contactNumber, guardianName, guardianContact, address, isActive } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  if (name || email) {
    await User.findByIdAndUpdate(student.userId, { name, email }, { new: true, runValidators: true });
  }

  const updated = await Student.findByIdAndUpdate(
    req.params.id,
    { rollNumber, registrationNumber, department, semester, section, batch, contactNumber, guardianName, guardianContact, address, isActive },
    { new: true, runValidators: true }
  ).populate('userId', 'name email contactNumber');

  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'StudentEdited', description: `Updated student: ${req.params.id}`, ipAddress: req.ip });
  res.json({ success: true, student: updated });
};

// @desc  Delete student
// @route DELETE /api/students/:id
// @access Admin
const deleteStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  student.isActive = false;
  await student.save();
  await User.findByIdAndUpdate(student.userId, { isActive: false });
  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'StudentDeleted', description: `Deactivated student: ${req.params.id}`, ipAddress: req.ip });
  res.json({ success: true, message: 'Student deactivated' });
};

// @desc  Get student by user ID
// @route GET /api/students/me
// @access Student
const getMyProfile = async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name email contactNumber');
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
  res.json({ success: true, student });
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile };
