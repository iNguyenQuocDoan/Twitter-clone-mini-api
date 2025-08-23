import { Router } from 'express'
import { loginController, registerController } from '../controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middleware/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

// Tạo router
const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)

/**
 * Desc: register a new user
 * Path: /register
 * Method: POST
 * Body: { email: string; password: string; confirm_password: string; date_of_birth: ISO8601 }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

export default usersRouter