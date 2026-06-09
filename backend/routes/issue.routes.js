const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { issueEquipment, getIssueTransactions, getIssueTransaction, getStudentIssues, checkOverdue } = require('../controllers/issue.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('admin', 'teacher'), asyncHandler(issueEquipment));
router.get('/', authorize('admin', 'teacher'), asyncHandler(getIssueTransactions));
router.patch('/check-overdue', authorize('admin'), asyncHandler(checkOverdue));
router.get('/student/:studentId', asyncHandler(getStudentIssues));
router.get('/:id', authorize('admin', 'teacher'), asyncHandler(getIssueTransaction));

module.exports = router;
