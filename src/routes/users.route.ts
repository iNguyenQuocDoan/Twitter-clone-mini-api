import { Router } from 'express'
import { loginController, registerController, logoutController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  registerValidator,
  refreshTokenValidator
} from '~/middleware/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

// Tạo router
const usersRouter = Router()

/**
 * Desc: login new user
 * Path: /login
 * Method: POST
 * Body: { email: string; password: string; }
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Desc: register a new user
 * Path: /register
 * Method: POST
 * Body: { email: string; password: string; confirm_password: string; date_of_birth: ISO8601 }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Desc:logout user
 * Path: /logout
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

export default usersRouter
