const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { mockAuth, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(mockAuth);

router.post('/', requireRole(['FACULTY', 'SUPERADMIN']), courseController.createCourse);
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

router.post('/:courseId/modules', requireRole(['FACULTY', 'SUPERADMIN']), courseController.createModule);
router.post('/modules/:moduleId/materials', requireRole(['FACULTY', 'SUPERADMIN']), upload.single('file'), courseController.uploadMaterial);

module.exports = router;
