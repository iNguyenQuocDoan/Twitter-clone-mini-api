import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middleware/users.middlewares'

// Tạo router
const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)

/**
 * Description: Register new user
 * Path: /register
 * Method: POST
 * Body:{name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, registerController)

export default usersRouter
