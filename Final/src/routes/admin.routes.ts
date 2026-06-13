import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getAnalytics,
  getUsersOverTime,
  getUserReports
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Secure all routes
router.use(authenticate, authorize(Role.SUPER_ADMIN));

router.get('/analytics', getAnalytics);
router.get('/analytics/users-over-time', getUsersOverTime);
router.get('/reports/users', getUserReports);

router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/reset-password', resetPassword);

export default router;
