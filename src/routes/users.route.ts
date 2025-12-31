import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middleware/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

// Tạo router
const usersRouter = Router()

/**
 * Description: Login user
 * Path: /login
 * Method: POST
 * Body:{email: string, password: string}
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description: Register new user
 * Path: /register
 * Method: POST
 * Body:{name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Description: Logout user
 * Path: /logout
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body:{refresh_token: string}
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

export default usersRouter
