import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application, Request, Response } from 'express';


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Progitek System API',
      version: '1.0.0',
      description: 'API REST pour le système de gestion technique Progitek',
      contact: {
        name: 'Équipe Progitek',
        email: 'support@progitek.ci',
        url: 'https://progitek.ci'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.progitek.ci' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                libelle: { type: 'string' }
              }
            }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            telephone: { type: 'string' },
            entreprise: { type: 'string' },
            typeDeCart: { 
              type: 'string', 
              enum: ['Standard', 'Premium', 'VIP'] 
            }
          }
        },
        Mission: {
          type: 'object',
          properties: {
            numIntervention: { type: 'string' },
            natureIntervention: { type: 'string' },
            objectifDuContrat: { type: 'string' },
            priorite: { 
              type: 'string', 
              enum: ['normale', 'urgente'] 
            },
            statut: { 
              type: 'string', 
              enum: ['planifiee', 'en_cours', 'terminee', 'annulee'] 
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            error: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Progitek API Documentation'
  }));
  
  // JSON endpoint for API specs
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export { specs };