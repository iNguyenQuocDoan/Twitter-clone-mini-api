import { Router } from 'express'
import {
  getStatsController,
  listUsersController,
  updateUserController,
} from '~/controllers/admin.controllers'
import { adminListAllController, adminListMessagesController } from '~/controllers/messages.controllers'
import { accessTokenValidator, requireAdmin } from '~/middleware/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const adminRouter = Router()

// Every admin route: must be logged in AND have role = Admin
adminRouter.use(accessTokenValidator, requireAdmin)

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Aggregate system stats
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Stats }
 *       403: { description: Admin role required }
 */
adminRouter.get('/stats', wrapRequestHandler(getStatsController))

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users (paginated, optional search by name/username/email)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: User list }
 */
adminRouter.get('/users', wrapRequestHandler(listUsersController))

/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update role or verify status (cannot self-edit)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: integer, enum: [0, 1] }
 *               verify: { type: integer, enum: [0, 1, 2] }
 *     responses:
 *       200: { description: Updated user }
 *       400: { description: Invalid body or self-edit attempt }
 *       404: { description: User not found }
 */
adminRouter.patch('/users/:id', wrapRequestHandler(updateUserController))

/**
 * @swagger
 * /admin/conversations:
 *   get:
 *     tags: [Admin]
 *     summary: List ALL conversations across users (read-only moderation view)
 *     security: [{ BearerAuth: [] }]
 */
adminRouter.get('/conversations', wrapRequestHandler(adminListAllController))

/**
 * @swagger
 * /admin/conversations/{id}/messages:
 *   get:
 *     tags: [Admin]
 *     summary: Read any conversation's messages (admin override — bypasses member check)
 *     security: [{ BearerAuth: [] }]
 */
adminRouter.get('/conversations/:id/messages', wrapRequestHandler(adminListMessagesController))

export default adminRouter
