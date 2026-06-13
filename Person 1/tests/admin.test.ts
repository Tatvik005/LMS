import request from 'supertest';
import app from '../src/app';
import prisma from '../src/core/db';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Admin API', () => {
  let superAdminCookies: string[] = [];
  let superAdminId = '';
  let testStudentId = '';

  beforeAll(async () => {
    // Create a SUPER_ADMIN to perform the actions
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@test.com',
        password: passwordHash,
        role: Role.SUPER_ADMIN,
      }
    });
    superAdminId = admin.id;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@test.com', password: 'admin123' });
      
    superAdminCookies = res.header['set-cookie'];
  });

  describe('POST /api/admin/users', () => {
    it('should create a new student', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Cookie', superAdminCookies)
        .send({
          name: 'Created Student',
          email: 'created@student.com',
          password: 'password123',
          role: Role.STUDENT
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('created@student.com');
      testStudentId = res.body.id;
    });

    it('should not allow creating a SUPER_ADMIN', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Cookie', superAdminCookies)
        .send({
          name: 'Another Admin',
          email: 'another@admin.com',
          password: 'password123',
          role: Role.SUPER_ADMIN
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should list users with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.page).toBe(1);
    });

    it('should filter by search', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=created')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.body.users[0].email).toBe('created@student.com');
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get a specific user profile', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testStudentId}`)
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testStudentId);
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user details', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testStudentId}`)
        .set('Cookie', superAdminCookies)
        .send({
          name: 'Updated Name',
          role: Role.FACULTY
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.role).toBe(Role.FACULTY);
    });

    it('should not allow admin to change their own role', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${superAdminId}`)
        .set('Cookie', superAdminCookies)
        .send({
          role: Role.FACULTY
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/users/:id/reset-password', () => {
    it('should reset user password', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testStudentId}/reset-password`)
        .set('Cookie', superAdminCookies)
        .send({
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(200);

      // Verify the user can login with the new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'created@student.com', password: 'newpassword123' });
      
      expect(loginRes.status).toBe(200);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should not allow admin to delete themselves', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${superAdminId}`)
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(400);
    });

    it('should soft delete user', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${testStudentId}`)
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.body.user.deletedAt).not.toBeNull();
    });

    it('should reject login for soft-deleted user', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'created@student.com', password: 'newpassword123' });
      
      expect(loginRes.status).toBe(400); // Because it is disabled
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return institution analytics dashboard data', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalStudents');
      expect(res.body).toHaveProperty('totalFaculty');
      expect(res.body).toHaveProperty('totalCourses', 0);
      expect(res.body).toHaveProperty('totalAssignments', 0);
      expect(res.body).toHaveProperty('newUsersThisMonth');
      expect(res.body).toHaveProperty('recentUsers');
      expect(Array.isArray(res.body.recentUsers)).toBe(true);
      expect(res.body.recentUsers.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/analytics/users-over-time', () => {
    it('should return users over time grouped by month', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/users-over-time')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('month');
      expect(res.body[0]).toHaveProperty('count');
      expect(typeof res.body[0].count).toBe('number');
    });
  });

  describe('GET /api/admin/reports/users', () => {
    it('should return user report as JSON', async () => {
      const res = await request(app)
        .get('/api/admin/reports/users?format=json')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('email');
        expect(res.body[0]).toHaveProperty('role');
      }
    });

    it('should return user report as CSV', async () => {
      const res = await request(app)
        .get('/api/admin/reports/users?format=csv')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename="users-report.csv"');
      expect(typeof res.text).toBe('string');
      expect(res.text).toContain('Email'); // CSV Header
      expect(res.text).toContain('superadmin@test.com'); // Admin should be in there
    });

    it('should filter user report by role', async () => {
      const res = await request(app)
        .get('/api/admin/reports/users?format=json&role=STUDENT')
        .set('Cookie', superAdminCookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((user: any) => {
        expect(user.role).toBe(Role.STUDENT);
      });
    });
  });
});
