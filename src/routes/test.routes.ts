import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/admin', authenticate, authorize(Role.SUPER_ADMIN), (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

router.get('/faculty', authenticate, authorize(Role.FACULTY), (req, res) => {
  res.json({ message: 'Welcome Faculty' });
});

router.get('/student', authenticate, authorize(Role.STUDENT), (req, res) => {
  res.json({ message: 'Welcome Student' });
});

router.get('/staff', authenticate, authorize(Role.SUPER_ADMIN, Role.FACULTY), (req, res) => {
  res.json({ message: 'Welcome Staff' });
});

export default router;
