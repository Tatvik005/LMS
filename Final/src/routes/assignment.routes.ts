import express from 'express';
import { createAssignment, getAssignments, submitAssignment, gradeSubmission } from '../controllers/assignment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('FACULTY', 'SUPER_ADMIN'), upload.single('file'), createAssignment);
router.get('/course/:courseId', getAssignments);

// Student submits an assignment
router.post('/:assignmentId/submit', authorize('STUDENT'), upload.single('file'), submitAssignment);

// Faculty grades a submission
router.put('/submissions/:submissionId/grade', authorize('FACULTY', 'SUPER_ADMIN'), gradeSubmission);

export default router;
