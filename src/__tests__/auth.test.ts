import request from 'supertest';
import mongoose from 'mongoose';
import App from '../app';
import DatabaseService from '../config/db.config';

describe('Authentication API', () => {
  let app: App;
  let server: any;
  let dbService: DatabaseService;

  beforeAll(async () => {
    // Initialize app
    app = new App();
    server = app.app;
    dbService = DatabaseService.getInstance();
    
    // Connect to test database
    await dbService.connect();
  });

  afterAll(async () => {
    // Clean up: close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/v1/public/auth/register', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'TestPassword123!',
    };

    it('should register a new user successfully', async () => {
      const response = await request(server)
        .post('/api/v1/public/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(server)
        .post('/api/v1/public/auth/register')
        .send({
          email: testUser.email,
          // Missing username and password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject duplicate email registration', async () => {
      // Try to register with same email
      const response = await request(server)
        .post('/api/v1/public/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/public/auth/login', () => {
    const testUser = {
      email: `login-test-${Date.now()}@example.com`,
      username: `logintest${Date.now()}`,
      password: 'TestPassword123!',
    };

    beforeAll(async () => {
      // Register a user first
      await request(server)
        .post('/api/v1/public/auth/register')
        .send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(server)
        .post('/api/v1/public/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(server)
        .post('/api/v1/public/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login with invalid password', async () => {
      const response = await request(server)
        .post('/api/v1/public/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(server)
        .post('/api/v1/public/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
