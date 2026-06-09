const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const {
  generateSubmissionQR, submitPractical, getSubmissions, getMySubmissions,
  reviewSubmission, getSubmissionQRs, toggleSubmissionQR, scanSubmissionQR,
} = require('../controllers/submission.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadSubmission } = require('../utils/cloudinary');
const multer = require('multer');

const upload = uploadSubmission.fields([
  { name: 'images', maxCount: 5 },
  { name: 'pdf', maxCount: 1 },
]);

router.use(protect);
router.post('/scan', asyncHandler(scanSubmissionQR));
router.get('/qr', authorize('admin', 'teacher'), asyncHandler(getSubmissionQRs));
router.post('/qr', authorize('admin', 'teacher'), asyncHandler(generateSubmissionQR));
router.patch('/qr/:id/toggle', authorize('admin', 'teacher'), asyncHandler(toggleSubmissionQR));
router.get('/my', authorize('student'), asyncHandler(getMySubmissions));
router.post('/', authorize('student'), upload, asyncHandler(submitPractical));
router.get('/', authorize('admin', 'teacher'), asyncHandler(getSubmissions));
router.patch('/:id/review', authorize('admin', 'teacher'), asyncHandler(reviewSubmission));

module.exports = router;
