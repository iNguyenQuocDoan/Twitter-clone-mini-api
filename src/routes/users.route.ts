import { Router } from 'express'
import {
  loginController,
  logoutController,
  registerController,
  refreshTokenController,
  verifyEmailController,
  resendVerifyEmailController,
  forgotPasswordController,
  resetPasswordController,
  getMeController,
  updateMeController,
  changePasswordController,
  getProfileController,
  getUserTweetsController,
  followController,
  unfollowController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  optionalAccessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  forgotPasswordValidator,
  forgotPasswordTokenValidator,
  resetPasswordValidator,
  updateMeValidator,
  changePasswordValidator,
  followValidator
} from '~/middleware/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

/**
 * @swagger
 * /users/register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       200:
 *         description: Register success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Register success
 *                 result:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login success
 *                 result:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       422:
 *         description: Email or password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * @swagger
 * /users/logout:
 *   post:
 *     tags:
 *       - Users
 *     summary: Logout user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: eyJhbGci...
 *     responses:
 *       200:
 *         description: Logout success
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
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * @swagger
 * /users/verify-email:
 *   post:
 *     tags:
 *       - Users
 *     summary: Verify email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_verify_token
 *             properties:
 *               email_verify_token:
 *                 type: string
 *                 example: eyJhbGci...
 *     responses:
 *       200:
 *         description: Email verified successfully or already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *                 result:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))

/**
 * @swagger
 * /users/resend-verify-email:
 *   post:
 *     tags:
 *       - Users
 *     summary: Resend email verification token
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Resend verify email successfully
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
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     tags:
 *       - Users
 *     summary: Request password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Check email to reset password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     tags:
 *       - Users
 *     summary: Reset password using forgot password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - forgot_password_token
 *               - password
 *               - confirm_password
 *             properties:
 *               forgot_password_token:
 *                 type: string
 *                 example: eyJhbGci...
 *               password:
 *                 type: string
 *                 example: NewPassword@123
 *               confirm_password:
 *                 type: string
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Reset password successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.post(
  '/reset-password',
  forgotPasswordTokenValidator,
  resetPasswordValidator,
  wrapRequestHandler(resetPasswordController)
)

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Get me successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get me successfully
 *                 result:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               date_of_birth:
 *                 type: string
 *                 format: date-time
 *                 example: '1990-01-01T00:00:00.000Z'
 *               bio:
 *                 type: string
 *                 example: Hello world
 *               location:
 *                 type: string
 *                 example: Ho Chi Minh City
 *               website:
 *                 type: string
 *                 example: https://example.com
 *               username:
 *                 type: string
 *                 example: johndoe
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *               cover_photo:
 *                 type: string
 *                 example: https://example.com/cover.jpg
 *     responses:
 *       200:
 *         description: Update me successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update me successfully
 *                 result:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.patch('/me', accessTokenValidator, updateMeValidator, wrapRequestHandler(updateMeController))

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     tags:
 *       - Users
 *     summary: Change password
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old_password
 *               - password
 *               - confirm_password
 *             properties:
 *               old_password:
 *                 type: string
 *                 example: OldPassword@123
 *               password:
 *                 type: string
 *                 example: NewPassword@123
 *               confirm_password:
 *                 type: string
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Change password successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Old password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.put('/change-password', accessTokenValidator, changePasswordValidator, wrapRequestHandler(changePasswordController))

/**
 * @swagger
 * /users/{username}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get public profile of a user
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: johndoe
 *     responses:
 *       200:
 *         description: Get profile successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get profile successfully
 *                 result:
 *                   type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.get('/:username', optionalAccessTokenValidator, wrapRequestHandler(getProfileController))

/**
 * @swagger
 * /users/{username}/tweets:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get tweets authored by a specific user (paginated)
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Tweets list
 *       404:
 *         description: User not found
 */
usersRouter.get('/:username/tweets', optionalAccessTokenValidator, wrapRequestHandler(getUserTweetsController))

/**
 * @swagger
 * /users/follow:
 *   post:
 *     tags:
 *       - Users
 *     summary: Follow a user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followed_user_id
 *             properties:
 *               followed_user_id:
 *                 type: string
 *                 example: 64b1f1f1f1f1f1f1f1f1f1f1
 *     responses:
 *       200:
 *         description: Follow successfully or already followed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid user id or cannot follow yourself
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.post('/follow', accessTokenValidator, followValidator, wrapRequestHandler(followController))

/**
 * @swagger
 * /users/follow/{user_id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Unfollow a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64b1f1f1f1f1f1f1f1f1f1f1
 *     responses:
 *       200:
 *         description: Unfollow successfully or not followed
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
usersRouter.delete('/follow/:user_id', accessTokenValidator, wrapRequestHandler(unfollowController))

export default usersRouter
