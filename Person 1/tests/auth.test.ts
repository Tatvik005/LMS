import request from 'supertest';
import app from '../src/app';
import prisma from '../src/core/db';
import { Role } from '@prisma/client';

describe('Auth API', () => {
  let userCookies: string[] = [];
  let userRefreshToken = '';

  const testUser = {
    name: 'Test Student',
    email: 'test@student.com',
    password: 'password123',
    role: Role.STUDENT,
  };

  describe('POST /api/auth/register', () => {
    it('should register a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      // Check cookies
      const cookies = res.header['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
    });

    it('should not allow SUPER_ADMIN registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'admin@test.com',
          role: Role.SUPER_ADMIN,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login the registered user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      userCookies = res.header['set-cookie'];
      userRefreshToken = res.body.refreshToken;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile with valid cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', userCookies);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject if no auth token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should issue a new access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', userCookies) // Using the refresh cookie
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should delete the refresh token and clear cookies', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', userCookies);

      expect(res.status).toBe(200);
      
      // Check if DB token is removed
      const tokenInDb = await prisma.refreshToken.findUnique({
        where: { token: userRefreshToken },
      });
      expect(tokenInDb).toBeNull();
      
      // Check if cookies are cleared (max-age=0 or expires in past)
      const cookies = res.header['set-cookie'] as string[];
      expect(cookies.some(c => c.includes('accessToken=;'))).toBe(true);
    });
  });
});
