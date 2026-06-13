const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { mockAuth, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(mockAuth);

router.post('/', requireRole(['FACULTY', 'SUPERADMIN']), upload.single('file'), assignmentController.createAssignment);
router.get('/course/:courseId', assignmentController.getAssignments);

// Student submits an assignment
router.post('/:assignmentId/submit', requireRole(['STUDENT']), upload.single('file'), assignmentController.submitAssignment);

// Faculty grades a submission
router.put('/submissions/:submissionId/grade', requireRole(['FACULTY', 'SUPERADMIN']), assignmentController.gradeSubmission);

module.exports = router;
