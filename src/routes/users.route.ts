import { Router } from 'express'
import { loginController, registerController } from '../controllers/users.controllers'
import { loginValidator } from '~/middleware/users.middlewares'

// Tạo router
const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)
usersRouter.post('/register', registerController)

export default usersRouter