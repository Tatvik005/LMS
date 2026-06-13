const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { mockAuth, requireRole } = require('../middlewares/authMiddleware');

router.use(mockAuth);

router.post('/', requireRole(['FACULTY', 'SUPERADMIN']), attendanceController.markAttendance);
router.get('/course/:courseId/report', requireRole(['FACULTY', 'SUPERADMIN']), attendanceController.getCourseAttendance);
router.get('/course/:courseId/my', requireRole(['STUDENT']), attendanceController.getMyAttendance);

module.exports = router;
