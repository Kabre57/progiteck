import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

describe('Clients API', () => {
  let accessToken: string;
  let clientId: number;

  beforeAll(async () => {
    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'amoikon@progitek.ci',
        motDePasse: 'admin123'
      });

    accessToken = loginResponse.body.data.tokens.accessToken;
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const clientData = {
        nom: 'Test Client',
        email: 'test@client.com',
        telephone: '+225 07 12 34 56 78',
        entreprise: 'Test Company',
        typeDeCart: 'Standard'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(clientData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nom).toBe(clientData.nom);
      expect(response.body.data.email).toBe(clientData.email);

      clientId = response.body.data.id;
    });

    it('should reject duplicate email', async () => {
      const clientData = {
        nom: 'Another Client',
        email: 'test@client.com', // Same email as above
        typeDeCart: 'Standard'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(clientData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/clients', () => {
    it('should get clients list', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/clients?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/clients?search=Test')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should get client by id', async () => {
      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(clientId);
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/99999')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update client', async () => {
      const updateData = {
        nom: 'Updated Client Name',
        entreprise: 'Updated Company'
      };

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nom).toBe(updateData.nom);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete client', async () => {
      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted client', async () => {
      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.client.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
  });
});