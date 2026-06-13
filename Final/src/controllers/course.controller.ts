import { Response } from 'express';
import prisma from '../core/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, bannerImage } = req.body;
    const course = await prisma.course.create({
      data: {
        title,
        description,
        bannerImage,
        facultyId: req.user!.id
      }
    });
    res.status(201).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let courses;
    if (req.user!.role === 'SUPER_ADMIN') {
      courses = await prisma.course.findMany();
    } else if (req.user!.role === 'FACULTY') {
      courses = await prisma.course.findMany({ where: { facultyId: req.user!.id } });
    } else {
      // Student
      if (req.query.enrolled === 'true') {
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: req.user!.id },
          include: { course: true }
        });
        courses = enrollments.map(e => e.course);
      } else {
        courses = await prisma.course.findMany();
      }
    }
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        modules: {
          include: { materials: true }
        },
        assignments: true
      }
    });
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const module = await prisma.module.create({
      data: {
        title,
        description,
        courseId: req.params.courseId
      }
    });
    res.status(201).json(module);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, fileType } = req.body;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const material = await prisma.material.create({
      data: {
        title,
        fileType: fileType || file.mimetype,
        fileUrl: `/uploads/${file.filename}`, // Serve locally
        moduleId: req.params.moduleId
      }
    });
    res.status(201).json(material);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const enrollInCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id;
    const studentId = req.user!.id;
    
    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } }
    });
    
    if (existing) {
      res.status(400).json({ message: 'Already enrolled' });
      return;
    }
    
    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId }
    });
    
    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id;
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: true }
    });
    res.json(enrollments.map(e => e.student));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
