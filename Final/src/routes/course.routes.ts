import express from 'express';
import { createCourse, getCourses, getCourseById, createModule, uploadMaterial, enrollInCourse, getCourseStudents } from '../controllers/course.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('FACULTY', 'SUPER_ADMIN'), createCourse);
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.get('/:id/students', authorize('FACULTY', 'SUPER_ADMIN'), getCourseStudents);
router.post('/:id/enroll', authorize('STUDENT'), enrollInCourse);

router.post('/:courseId/modules', authorize('FACULTY', 'SUPER_ADMIN'), createModule);
router.post('/modules/:moduleId/materials', authorize('FACULTY', 'SUPER_ADMIN'), upload.single('file'), uploadMaterial);

export default router;
