const User = require('../models/User');
const { createAuditLog } = require('../utils/auditHelper');

// @desc  Get all users
// @route GET /api/users
// @access Admin
const getUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, total, page: Number(page), users });
};

// @desc  Get single user
// @route GET /api/users/:id
// @access Admin
const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};

// @desc  Create user (by admin)
// @route POST /api/users
// @access Admin
const createUser = async (req, res) => {
  const { name, email, password, role, department, contactNumber } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ success: false, message: 'User already exists' });
  const user = await User.create({ name, email, password, role, department, contactNumber });
  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'UserCreated', description: `Created user: ${name}`, ipAddress: req.ip });
  res.status(201).json({ success: true, user });
};

// @desc  Update user
// @route PUT /api/users/:id
// @access Admin
const updateUser = async (req, res) => {
  const { name, email, role, department, contactNumber, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, department, contactNumber, isActive },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};

// @desc  Delete user
// @route DELETE /api/users/:id
// @access Admin
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'UserDeleted', description: `Deleted user: ${user.name}`, ipAddress: req.ip });
  res.json({ success: true, message: 'User deleted' });
};

// @desc  Update own profile
// @route PUT /api/users/profile
// @access Private
const updateProfile = async (req, res) => {
  const { name, department, contactNumber } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, department, contactNumber },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, updateProfile };
