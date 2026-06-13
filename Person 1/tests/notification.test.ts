import request from 'supertest';
import app from '../src/app';
import prisma from '../src/core/db';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Notification API', () => {
  let superAdminCookies: string[] = [];
  let testUserId = '';

  beforeAll(async () => {
    // Clean up
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin_notif@test.com',
        password: passwordHash,
        role: Role.SUPER_ADMIN,
      }
    });
    testUserId = admin.id;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin_notif@test.com', password: 'admin123' });
      
    superAdminCookies = res.header['set-cookie'];
  });

  describe('POST /api/notifications/send', () => {
    it('should create a new notification (internal)', async () => {
      const res = await request(app)
        .post('/api/notifications/send')
        .set('Cookie', superAdminCookies)
        .send({
          userId: testUserId,
          title: 'Welcome',
          message: 'Welcome to the LMS'
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Welcome');
    });
  });

  describe('GET /api/notifications', () => {
    it('should get all notifications for the user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe('Welcome');
      expect(res.body[0].isRead).toBe(false);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const getRes = await request(app)
        .get('/api/notifications')
        .set('Cookie', superAdminCookies);
      
      const notifId = getRes.body[0].id;

      const res = await request(app)
        .put(`/api/notifications/${notifId}/read`)
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.body.isRead).toBe(true);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Send another one first
      await request(app)
        .post('/api/notifications/send')
        .set('Cookie', superAdminCookies)
        .send({
          userId: testUserId,
          title: 'Another',
          message: 'Another notification'
        });

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);

      // Verify
      const getRes = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Cookie', superAdminCookies);
      expect(getRes.body.length).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      const getRes = await request(app)
        .get('/api/notifications')
        .set('Cookie', superAdminCookies);
      
      const notifId = getRes.body[0].id;

      const res = await request(app)
        .delete(`/api/notifications/${notifId}`)
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
    });
  });
});
