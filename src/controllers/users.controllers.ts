import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'

import userServices from '~/services/users.service'
import { RegisterRequestBody } from '~/models/requests/User.requests'
import { USER_MESSAGES } from '~/constants/message'

const loginController = async (req: Request, res: Response) => {
  const { user }: any = req
  const result = await userServices.login(user._id.toString())

  return res.status(200).json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await userServices.register(req.body)

  return res.status(200).json({
    message: USER_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export { loginController, registerController }
