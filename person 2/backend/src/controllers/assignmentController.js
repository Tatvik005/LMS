const prisma = require('../config/db');

// Create an assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, courseId } = req.body;
    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        attachmentUrl,
        courseId
      }
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Student submits an assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { textSubmission } = req.body;
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const submission = await prisma.submission.upsert({
      where: {
        studentId_assignmentId: {
          studentId: req.user.id,
          assignmentId: req.params.assignmentId
        }
      },
      update: {
        textSubmission,
        fileUrl,
        updatedAt: new Date()
      },
      create: {
        textSubmission,
        fileUrl,
        studentId: req.user.id,
        assignmentId: req.params.assignmentId
      }
    });
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Faculty grades a submission
exports.gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await prisma.submission.update({
      where: { id: req.params.submissionId },
      data: {
        grade: parseFloat(grade),
        feedback
      }
    });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get assignments for a course
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { courseId: req.params.courseId },
      include: {
        submissions: req.user.role === 'FACULTY' || req.user.role === 'SUPERADMIN' 
          ? true 
          : { where: { studentId: req.user.id } } // Students only see their own submissions
      }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
