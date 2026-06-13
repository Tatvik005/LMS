import { Response } from 'express';
import prisma from '../core/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getIo } from '../socket';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const userId = req.user!.id;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    if (notification.userId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not own this notification' });
      return;
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, title, message } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false
      }
    });

    // Emit via Socket.io
    try {
      const io = getIo();
      io.to(`user_${userId}`).emit('new_notification', notification);
    } catch (socketError) {
      console.warn('Socket not initialized, skipping real-time emit during test');
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
