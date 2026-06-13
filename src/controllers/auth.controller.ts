import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../core/db';
import { Role } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

const generateTokens = (user: { id: string; email: string; role: Role }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (role === Role.SUPER_ADMIN) {
      res.status(403).json({ message: 'Cannot self-register as SUPER_ADMIN' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: role as Role || Role.STUDENT,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setCookies(res, accessToken, refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      res.status(401).json({ message: 'Invalid credentials or account disabled' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setCookies(res, accessToken, refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }

    const dbToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!dbToken) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    if (dbToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token } });
      res.status(401).json({ message: 'Refresh token expired' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || user.deletedAt) {
      res.status(401).json({ message: 'User not found or account disabled' });
      return;
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
