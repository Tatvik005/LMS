import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocketServer } from './core/socket';
import authRoutes from './modules/auth/auth.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Socket.io
initSocketServer(httpServer);

// Routes
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
