import { Router } from 'express'
import { likeTweetController, unlikeTweetController } from '~/controllers/likes.controllers'
import { tweetIdBodyValidator, tweetIdParamValidator } from '~/middleware/interactions.middlewares'
import { accessTokenValidator } from '~/middleware/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const likesRouter = Router()

/**
 * @swagger
 * /likes:
 *   post:
 *     tags:
 *       - Likes
 *     summary: Like a tweet
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tweet_id
 *             properties:
 *               tweet_id:
 *                 type: string
 *                 example: 64b1f1f1f1f1f1f1f1f1f1f1
 *     responses:
 *       200:
 *         description: Like successfully or already liked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Like tweet successfully
 *                 result:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tweet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
likesRouter.post('/', accessTokenValidator, tweetIdBodyValidator, wrapRequestHandler(likeTweetController))

/**
 * @swagger
 * /likes/{tweet_id}:
 *   delete:
 *     tags:
 *       - Likes
 *     summary: Unlike a tweet
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tweet_id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64b1f1f1f1f1f1f1f1f1f1f1
 *     responses:
 *       200:
 *         description: Unlike successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
likesRouter.delete('/:tweet_id', accessTokenValidator, tweetIdParamValidator, wrapRequestHandler(unlikeTweetController))

export default likesRouter
