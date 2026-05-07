import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import path from 'path'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Twitter Clone Mini API',
      version: '1.0.0',
      description: 'API documentation for Twitter Clone Mini'
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password', 'confirm_password', 'date_of_birth'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'Password@123' },
            confirm_password: { type: 'string', example: 'Password@123' },
            date_of_birth: { type: 'string', format: 'date-time', example: '1990-01-01T00:00:00.000Z' }
          }
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'Password@123' }
          }
        },
        TokenResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        }
      }
    },
    servers: [{ url: 'http://localhost:9990', description: 'Development server' }]
  },
  apis: [
    path.resolve(__dirname, '../routes/*.route.ts'),
    path.resolve(__dirname, '../routes/*.route.js')
  ]
}

const swaggerSpec = swaggerJsdoc(options)

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
