import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allows local dev across ports
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    let token = socket.handshake.auth.token;
    
    if (!token && socket.handshake.headers['authorization']) {
      const authHeader = socket.handshake.headers['authorization'];
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, val] = cookie.trim().split('=');
        if (name === 'accessToken') {
          token = val;
          break;
        }
      }
    }

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    // Join the specific user room
    socket.join(`user_${userId}`);
    
    socket.on('disconnect', () => {
      // Automatic cleanup
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
