import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import userServices from '~/services/users.service'
import { RegisterRequestBody } from '~/models/requests/User.requests'

const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'doannguyen@gmail.com' && password === '123') {
    return res.json({
      message: 'login success'
    })
  }
  return res.status(400).json({
    error: 'login failed'
  })
}

const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await userServices.register(req.body)

  return res.status(200).json({
    message: 'register success',
    result
  })
}

export { loginController, registerController }
