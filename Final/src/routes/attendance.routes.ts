import express from 'express';
import { markAttendance, getCourseAttendance, getMyAttendance } from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('FACULTY', 'SUPER_ADMIN'), markAttendance);
router.get('/course/:courseId/report', authorize('FACULTY', 'SUPER_ADMIN'), getCourseAttendance);
router.get('/course/:courseId/my', authorize('STUDENT'), getMyAttendance);

export default router;
