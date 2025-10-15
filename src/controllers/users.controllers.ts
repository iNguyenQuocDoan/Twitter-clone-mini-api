import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { RegisterRequestBody, LoginRequestBody, LogoutRequestBody, TokenPayload } from '~/model/requests/Users.requests'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

const loginController = async (
  req: Request<ParamsDictionary, any, LoginRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Login controller called with:', req.body)

    const result = await usersService.login(req.body)

    console.log('Login successful:', result)

    return res.json({
      message: 'Login success',
      data: result
    })
  } catch (error) {
    console.log('Login error:', error)
    next(error)
  }
}

const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Nhận kết quả từ service (bao gồm cả token)
    const result = await usersService.register(req.body)

    // In ra console để debug
    console.log('Access Token:', result.access_token)
    console.log('Refresh Token:', result.refresh_token)

    return res.json({
      message: 'register success',
      data: result
    })
  } catch (error) {
    // Chuyển lỗi cho error middleware xử lý
    next(error)
  }
}

const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refresh_token } = req.body
    const user = (req as any).user // Từ accessTokenValidator

    const result = await usersService.logout({
      user_id: user._id.toString(),
      refresh_token
    })

    return res.json({
      message: 'Logout successful',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const emailVerifyValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGES.USER_NOT_FOUND
    })
  }

  //Verified => status OK, messsage Verified
  if (user.email_verify_token === '') {
    return res.json({
      message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }

  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USER_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export { loginController, registerController, logoutController, emailVerifyValidator }
