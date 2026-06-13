import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../core/db';
import { Role } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Parser } from 'json2csv';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as Role | undefined;
    const search = req.query.search as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (![Role.FACULTY, Role.STUDENT].includes(role)) {
      res.status(400).json({ message: 'Admin can only create Faculty or Student roles' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Mock sending email
    console.log(`[Email Mock] Welcome to the LMS, ${name}! Your role is ${role}.`);

    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (role && req.user?.id === id) {
      res.status(400).json({ message: 'Cannot change own role' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if email is taken by someone else
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        res.status(400).json({ message: 'Email already in use' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
        deletedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error or user not found' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({ message: 'Cannot delete own account' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        email: true,
        deletedAt: true
      }
    });

    res.json({ message: 'User soft deleted successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error or user not found' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: passwordHash }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error or user not found' });
  }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStudents, totalFaculty, newUsersThisMonth, recentUsers] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT, deletedAt: null } }),
      prisma.user.count({ where: { role: Role.FACULTY, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      })
    ]);

    res.json({
      totalStudents,
      totalFaculty,
      totalCourses: 0,
      totalAssignments: 0,
      newUsersThisMonth,
      recentUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsersOverTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const results = await prisma.$queryRaw<Array<{ month: string; count: bigint | number }>>`
      SELECT 
        TO_CHAR("createdAt", 'Mon YYYY') as "month",
        COUNT(*)::bigint as "count",
        MIN("createdAt") as "min_date"
      FROM "User"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'Mon YYYY')
      ORDER BY "min_date" ASC
    `;

    const formattedResults = results.map(row => ({
      month: row.month,
      count: Number(row.count)
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.query.role as string | undefined;
    const format = req.query.format as string | undefined;
    
    // Default to 30 days ago
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const fromParam = req.query.from ? new Date(req.query.from as string) : defaultFrom;
    
    // Default to today
    const defaultTo = new Date();
    const toParam = req.query.to ? new Date(req.query.to as string) : defaultTo;
    
    const where: any = {
      createdAt: {
        gte: fromParam,
        lte: toParam
      }
    };

    if (role && role !== 'ALL') {
      where.role = role as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'Role', value: 'role' },
        { label: 'Registered On', value: (row: any) => row.createdAt.toISOString() }
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(users);

      res.header('Content-Type', 'text/csv');
      res.attachment('users-report.csv');
      res.send(csv);
    } else {
      res.json(users);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
