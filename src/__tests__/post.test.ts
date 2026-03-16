import request from 'supertest';
import mongoose from 'mongoose';
import App from '../app';
import DatabaseService from '../config/db.config';
import UserService from '../services/user.service';
import HashService from '../utils/hash.utils';

describe('Post API', () => {
  let app: App;
  let server: any;
  let dbService: DatabaseService;
  let accessToken: string;
  let userId: string;
  const userService = new UserService();

  beforeAll(async () => {
    // Initialize app
    app = new App();
    server = app.app;
    dbService = DatabaseService.getInstance();
    
    // Connect to test database
    await dbService.connect();

    // Create a test user and get access token
    const testEmail = `post-test-${Date.now()}@example.com`;
    const testUsername = `posttest${Date.now()}`;
    const testPassword = 'TestPassword123!';
    
    const hashedPassword = await HashService.hashPassword(testPassword);
    const user = await userService.save({
      email: testEmail,
      username: testUsername,
      password: hashedPassword.password,
      isVerified: true,
    });
    userId = user._id as string;

    // Login to get access token
    const loginResponse = await request(server)
      .post('/api/v1/public/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up: close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/v1/protected/posts', () => {
    const testPost = {
      title: 'Test Post Title',
      description: 'This is a test post description',
      content: '# Test Content\n\nThis is test content for the post.',
      category: 'Test Category',
      tags: ['test', 'example'],
      publicationStatus: 'draft',
    };

    it('should create a post successfully with valid token', async () => {
      const response = await request(server)
        .post('/api/v1/protected/posts')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(testPost)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('post_id');
      expect(response.body.data.post).toHaveProperty('title', testPost.title);
    });

    it('should reject post creation without authentication', async () => {
      const response = await request(server)
        .post('/api/v1/protected/posts')
        .send(testPost)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject post creation with invalid token', async () => {
      const response = await request(server)
        .post('/api/v1/protected/posts')
        .set('Cookie', 'accessToken=invalid-token')
        .send(testPost)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should create post with published status', async () => {
      const publishedPost = {
        ...testPost,
        title: 'Published Test Post',
        publicationStatus: 'published',
      };

      const response = await request(server)
        .post('/api/v1/protected/posts')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(publishedPost)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.post).toHaveProperty('publicationStatus', 'published');
    });
  });

  describe('GET /api/v1/protected/posts', () => {
    it('should retrieve posts with valid token', async () => {
      const response = await request(server)
        .get('/api/v1/protected/posts')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should reject post retrieval without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/protected/posts')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
