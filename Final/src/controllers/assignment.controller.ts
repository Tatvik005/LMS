import { Response } from 'express';
import prisma from '../core/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { textSubmission } = req.body;
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const submission = await prisma.submission.upsert({
      where: {
        studentId_assignmentId: {
          studentId: req.user!.id,
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
        studentId: req.user!.id,
        assignmentId: req.params.assignmentId
      }
    });
    res.status(200).json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { courseId: req.params.courseId },
      include: {
        submissions: req.user!.role === 'FACULTY' || req.user!.role === 'SUPER_ADMIN' 
          ? true 
          : { where: { studentId: req.user!.id } } // Students only see their own submissions
      }
    });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
