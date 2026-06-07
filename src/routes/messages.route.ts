import { Router } from 'express'
import {
  createOrGetDMController,
  listConversationsController,
  listMessagesController,
  sendMessageController,
  markReadController,
} from '~/controllers/messages.controllers'
import { accessTokenValidator } from '~/middleware/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const messagesRouter = Router()

messagesRouter.use(accessTokenValidator)

/**
 * @swagger
 * /conversations:
 *   post: { tags: [Messages], summary: Get or create a 1-on-1 DM }
 *   get:  { tags: [Messages], summary: List my conversations (paginated) }
 */
messagesRouter.post('/', wrapRequestHandler(createOrGetDMController))
messagesRouter.get('/', wrapRequestHandler(listConversationsController))

/**
 * @swagger
 * /conversations/{id}/messages:
 *   get:  { tags: [Messages], summary: List messages of a conversation (paginated, ASC within page) }
 *   post: { tags: [Messages], summary: Send a message }
 */
messagesRouter.get('/:id/messages', wrapRequestHandler(listMessagesController))
messagesRouter.post('/:id/messages', wrapRequestHandler(sendMessageController))

/**
 * @swagger
 * /conversations/{id}/read:
 *   post: { tags: [Messages], summary: Mark all messages of a conversation as read for me }
 */
messagesRouter.post('/:id/read', wrapRequestHandler(markReadController))

export default messagesRouter
