import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import testRoutes from './routes/test.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';

import courseRoutes from './routes/course.routes';
import assignmentRoutes from './routes/assignment.routes';
import attendanceRoutes from './routes/attendance.routes';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);

export default app;
