const User = require('../models/User');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');
const { createAuditLog } = require('../utils/auditHelper');

// @desc  Register a new user
// @route POST /api/auth/register
// @access Public (admin only after initial setup)
const register = async (req, res) => {
  const { name, email, password, role, department, contactNumber } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }
  const user = await User.create({ name, email, password, role, department, contactNumber });
  const token = generateToken(user._id);
  res.status(201).json({ success: true, token, user });
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
  }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'Login',
    description: `${user.name} logged in`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const token = generateToken(user._id);

  // If student, also fetch student profile
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ userId: user._id });
  }

  res.json({ success: true, token, user, studentProfile });
};

// @desc  Get current user profile
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ userId: user._id });
  }
  res.json({ success: true, user, studentProfile });
};

// @desc  Update password
// @route PUT /api/auth/password
// @access Private
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }
  user.password = newPassword;
  await user.save();
  const token = generateToken(user._id);
  res.json({ success: true, token, message: 'Password updated successfully' });
};

// @desc  Logout
// @route POST /api/auth/logout
// @access Private
const logout = async (req, res) => {
  await createAuditLog({
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Logout',
    description: `${req.user.name} logged out`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, getMe, updatePassword, logout };
