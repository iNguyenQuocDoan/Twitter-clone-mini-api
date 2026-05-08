import { Router } from 'express'
import { bookmarkTweetController, unbookmarkTweetController } from './bookmarks.controllers'
import { tweetIdBodyValidator, tweetIdParamValidator } from './bookmarks.middlewares'
import { accessTokenValidator } from '../users/users.middlewares'
import { wrapRequestHandler } from '../../shared/utils/handlers'

const bookmarksRouter = Router()

/**
 * @swagger
 * /bookmarks:
 *   post:
 *     tags:
 *       - Bookmarks
 *     summary: Bookmark a tweet
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
 *         description: Bookmark successfully or already bookmarked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bookmark tweet successfully
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
bookmarksRouter.post('/', accessTokenValidator, tweetIdBodyValidator, wrapRequestHandler(bookmarkTweetController))

/**
 * @swagger
 * /bookmarks/{tweet_id}:
 *   delete:
 *     tags:
 *       - Bookmarks
 *     summary: Unbookmark a tweet
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
 *       204:
 *         description: Unbookmark successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
bookmarksRouter.delete('/:tweet_id', accessTokenValidator, tweetIdParamValidator, wrapRequestHandler(unbookmarkTweetController))

export default bookmarksRouter
