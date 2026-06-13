import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

const generateMockToken = (role: Role) => {
  return jwt.sign(
    { id: 'mock-id', email: 'mock@test.com', role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('RBAC Middleware', () => {
  const superAdminToken = generateMockToken(Role.SUPER_ADMIN);
  const facultyToken = generateMockToken(Role.FACULTY);
  const studentToken = generateMockToken(Role.STUDENT);

  describe('GET /api/test/admin', () => {
    it('should allow SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Welcome Admin');
    });

    it('should forbid FACULTY', async () => {
      const res = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    it('should forbid STUDENT', async () => {
      const res = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/test/faculty', () => {
    it('should allow FACULTY', async () => {
      const res = await request(app)
        .get('/api/test/faculty')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Welcome Faculty');
    });

    it('should forbid SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/test/faculty')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(403);
    });

    it('should forbid STUDENT', async () => {
      const res = await request(app)
        .get('/api/test/faculty')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/test/student', () => {
    it('should allow STUDENT', async () => {
      const res = await request(app)
        .get('/api/test/student')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Welcome Student');
    });

    it('should forbid SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/test/student')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/test/staff', () => {
    it('should allow SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/test/staff')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Welcome Staff');
    });

    it('should allow FACULTY', async () => {
      const res = await request(app)
        .get('/api/test/staff')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Welcome Staff');
    });

    it('should forbid STUDENT', async () => {
      const res = await request(app)
        .get('/api/test/staff')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Missing or Invalid Tokens', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/test/admin');
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/test/admin')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });
  });
});
