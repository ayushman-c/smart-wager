const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { getUsers, getUser, createUser, updateUser, deleteUser, updateProfile } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('admin'), asyncHandler(getUsers));
router.post('/', authorize('admin'), asyncHandler(createUser));
router.put('/profile', asyncHandler(updateProfile));
router.get('/:id', authorize('admin'), asyncHandler(getUser));
router.put('/:id', authorize('admin'), asyncHandler(updateUser));
router.delete('/:id', authorize('admin'), asyncHandler(deleteUser));

module.exports = router;
