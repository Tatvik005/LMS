const prisma = require('../config/db');

// Create a new course (Faculty only)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, bannerImage } = req.body;
    const course = await prisma.course.create({
      data: {
        title,
        description,
        bannerImage,
        facultyId: req.user.id
      }
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all courses (Faculty sees their own, Students see enrolled, Admin sees all)
exports.getCourses = async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'SUPERADMIN') {
      courses = await prisma.course.findMany();
    } else if (req.user.role === 'FACULTY') {
      courses = await prisma.course.findMany({ where: { facultyId: req.user.id } });
    } else {
      // Student
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        include: { course: true }
      });
      courses = enrollments.map(e => e.course);
    }
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get course by id (with modules and materials)
exports.getCourseById = async (req, res) => {
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
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a module for a course
exports.createModule = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload material to a module
exports.uploadMaterial = async (req, res) => {
  try {
    const { title, fileType } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const material = await prisma.material.create({
      data: {
        title,
        fileType: fileType || file.mimetype,
        fileUrl: `/uploads/${file.filename}`, // Serve locally
        moduleId: req.params.moduleId
      }
    });
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
