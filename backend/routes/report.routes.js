const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { getInventoryReport, getIssueReturnReport, getStudentHistory, getSubmissionReport, getMissingReport } = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/inventory', authorize('admin', 'teacher'), asyncHandler(getInventoryReport));
router.get('/issue-return', authorize('admin', 'teacher'), asyncHandler(getIssueReturnReport));
router.get('/submissions', authorize('admin', 'teacher'), asyncHandler(getSubmissionReport));
router.get('/missing', authorize('admin', 'teacher'), asyncHandler(getMissingReport));
router.get('/student/:studentId', asyncHandler(getStudentHistory));

module.exports = router;
