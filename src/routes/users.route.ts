import { Router } from 'express'
import loginController from '~/controllers/users.controllers'
import loginValidator from '~/middleware/users.middlewares'

// Tạo router
const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)

export default usersRouter