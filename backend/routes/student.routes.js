const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile } = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/me', asyncHandler(getMyProfile));
router.get('/', authorize('admin', 'teacher'), asyncHandler(getStudents));
router.post('/', authorize('admin', 'teacher'), asyncHandler(createStudent));
router.get('/:id', authorize('admin', 'teacher'), asyncHandler(getStudent));
router.put('/:id', authorize('admin', 'teacher'), asyncHandler(updateStudent));
router.delete('/:id', authorize('admin'), asyncHandler(deleteStudent));

module.exports = router;
