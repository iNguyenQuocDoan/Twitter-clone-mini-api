import { Router } from 'express'
import { createTweetController, getTweetController, getTimelineController } from './tweets.controllers'
import { createTweetValidator, tweetIdValidator } from './tweets.middlewares'
import { accessTokenValidator } from '../users/users.middlewares'
import { wrapRequestHandler } from '../../shared/utils/handlers'

const tweetsRouter = Router()

/**
 * @swagger
 * /tweets:
 *   post:
 *     tags:
 *       - Tweets
 *     summary: Create a new tweet
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - audience
 *               - content
 *             properties:
 *               type:
 *                 type: integer
 *                 enum: [0, 1, 2, 3]
 *                 description: "0=Tweet, 1=Retweet, 2=Comment, 3=QuoteTweet"
 *                 example: 0
 *               audience:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: "0=Everyone, 1=TwitterCircle"
 *                 example: 0
 *               content:
 *                 type: string
 *                 example: Hello Twitter!
 *               parent_id:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nodejs", "typescript"]
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               medias:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [image, video]
 *                 example: []
 *     responses:
 *       201:
 *         description: Create tweet successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create tweet successfully
 *                 result:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
tweetsRouter.post('/', accessTokenValidator, createTweetValidator, wrapRequestHandler(createTweetController))

/**
 * @swagger
 * /tweets/timeline:
 *   get:
 *     tags:
 *       - Tweets
 *     summary: Get home timeline (tweets from followed users)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tweets per page (max 100)
 *     responses:
 *       200:
 *         description: Get timeline successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get timeline successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     tweets:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
tweetsRouter.get('/timeline', accessTokenValidator, wrapRequestHandler(getTimelineController))

/**
 * @swagger
 * /tweets/{tweet_id}:
 *   get:
 *     tags:
 *       - Tweets
 *     summary: Get a single tweet by id
 *     parameters:
 *       - in: path
 *         name: tweet_id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64b1f1f1f1f1f1f1f1f1f1f1
 *     responses:
 *       200:
 *         description: Get tweet successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get tweet successfully
 *                 result:
 *                   type: object
 *       400:
 *         description: Invalid tweet id
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
tweetsRouter.get('/:tweet_id', tweetIdValidator, wrapRequestHandler(getTweetController))

export default tweetsRouter
