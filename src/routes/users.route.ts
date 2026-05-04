import { Router } from 'express'
import {
  loginController,
  logoutController,
  registerController,
  verifyEmailController,
  resendVerifyEmailController,
  forgotPasswordController,
  resetPasswordController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  forgotPasswordValidator,
  forgotPasswordTokenValidator,
  resetPasswordValidator
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

export default usersRouter
