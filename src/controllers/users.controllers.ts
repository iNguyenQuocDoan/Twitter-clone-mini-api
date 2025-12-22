import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userServices from '~/services/users.service'

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

const registerController = async (req: Request, res: Response) => {
  try {
    const result = await userServices.register(req.body)

    return res.status(200).json({
      message: 'register success'
    })
  } catch (error: any) {
    console.log('Register user error', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}

export { loginController, registerController }
