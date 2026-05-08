import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import userServices from '~/services/users.service'
import { RegisterRequestBody, UpdateMeRequestBody, ChangePasswordRequestBody } from '~/models/requests/User.requests'
import { USER_MESSAGES } from '~/constants/message'
import { UserVerifyStatus } from '~/constants/enums'
import { hashPassword } from '~/utils/crypto'
import { successResponse, errorResponse } from '~/utils/response'
import { ERROR_CODE } from '~/constants/errorCode'

const loginController = async (req: Request, res: Response) => {
  const { user }: any = req
  const result = await userServices.login(user._id.toString())
  return res.status(200).json(successResponse(result, USER_MESSAGES.LOGIN_SUCCESS))
}

const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await userServices.register(req.body)
  return res.status(201).json(successResponse(result, USER_MESSAGES.REGISTER_SUCCESS))
}

const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  await userServices.logout(refresh_token)
  return res.status(200).json(successResponse(null, USER_MESSAGES.LOGOUT_SUCCESS))
}

const verifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as { user_id: string }
  const user = await userServices.getUserById(user_id)

  if (!user) {
    return res.status(404).json(errorResponse(ERROR_CODE.USER_001, USER_MESSAGES.USER_NOT_FOUND))
  }
  if (user.email_verify_token === '') {
    return res.status(200).json(successResponse(null, USER_MESSAGES.EMAIL_ALREADY_VERIFIED))
  }

  const result = await userServices.verifyEmail(user_id)
  return res.status(200).json(successResponse(result, USER_MESSAGES.EMAIL_VERIFY_SUCCESS))
}

const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const user = await userServices.getUserById(user_id)

  if (!user) {
    return res.status(404).json(errorResponse(ERROR_CODE.USER_001, USER_MESSAGES.USER_NOT_FOUND))
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(200).json(successResponse(null, USER_MESSAGES.EMAIL_ALREADY_VERIFIED))
  }
  if (user.verify === UserVerifyStatus.Banned) {
    return res.status(403).json(errorResponse(ERROR_CODE.USER_004, USER_MESSAGES.USER_IS_BANNED))
  }

  await userServices.resendVerifyEmail(user_id)
  return res.status(200).json(successResponse(null, USER_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS))
}

const forgotPasswordController = async (req: Request, res: Response) => {
  const { _id } = req.user as any
  await userServices.forgotPassword(_id.toString())
  return res.status(200).json(successResponse(null, USER_MESSAGES.FORGOT_PASSWORD_SUCCESS))
}

const resetPasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_forgot_password_token as { user_id: string }
  const { password } = req.body
  await userServices.resetPassword(user_id, password)
  return res.status(200).json(successResponse(null, USER_MESSAGES.RESET_PASSWORD_SUCCESS))
}

const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const user = await userServices.getUserById(user_id)
  if (!user) {
    return res.status(404).json(errorResponse(ERROR_CODE.USER_001, USER_MESSAGES.USER_NOT_FOUND))
  }
  const { password, email_verify_token, forgot_password_token, ...safeUser } = user
  return res.status(200).json(successResponse(safeUser, USER_MESSAGES.GET_ME_SUCCESS))
}

const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const result = await userServices.updateMe(user_id, req.body)
  return res.status(200).json(successResponse(result, USER_MESSAGES.UPDATE_ME_SUCCESS))
}

const changePasswordController = async (req: Request<ParamsDictionary, any, ChangePasswordRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { old_password, password } = req.body
  const user = await userServices.getUserById(user_id)
  if (!user) {
    return res.status(404).json(errorResponse(ERROR_CODE.USER_001, USER_MESSAGES.USER_NOT_FOUND))
  }
  if (user.password !== hashPassword(old_password)) {
    return res.status(400).json(errorResponse(ERROR_CODE.USER_002, USER_MESSAGES.OLD_PASSWORD_INCORRECT))
  }
  await userServices.changePassword(user_id, password)
  return res.status(200).json(successResponse(null, USER_MESSAGES.CHANGE_PASSWORD_SUCCESS))
}

const getProfileController = async (req: Request, res: Response) => {
  const { username } = req.params
  const user = await userServices.getProfile(username)
  if (!user) {
    return res.status(404).json(errorResponse(ERROR_CODE.USER_001, USER_MESSAGES.USER_NOT_FOUND))
  }
  return res.status(200).json(successResponse(user, USER_MESSAGES.GET_PROFILE_SUCCESS))
}

const followController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { followed_user_id } = req.body
  const result = await userServices.follow(user_id, followed_user_id)
  if (result === null) {
    return res.status(200).json(successResponse(null, USER_MESSAGES.ALREADY_FOLLOWED))
  }
  return res.status(200).json(successResponse(null, USER_MESSAGES.FOLLOW_SUCCESS))
}

const unfollowController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { user_id: followed_user_id } = req.params
  await userServices.unfollow(user_id, followed_user_id)
  return res.status(204).send()
}

export {
  loginController,
  registerController,
  logoutController,
  verifyEmailController,
  resendVerifyEmailController,
  forgotPasswordController,
  resetPasswordController,
  getMeController,
  updateMeController,
  changePasswordController,
  getProfileController,
  followController,
  unfollowController
}
