import { config } from 'dotenv'

import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterRequestBody, UpdateMeRequestBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { RefreshToken } from '~/models/RefreshToken'
import { ObjectId } from 'mongodb'
import { USER_MESSAGES } from '~/constants/message'

config()

class UserServices {
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as any
      }
    })
  }

  // access token
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as any
      }
    })
  }
  // refresh token
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as any
      }
    })
  }

  // generate tokens
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  // check email exist
  async checkEmailExist(email: string) {
    const isExist = await databaseService.user.findOne({ email })
    return Boolean(isExist)
  }

  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())

    const user = new User({
      ...payload,
      _id: user_id,
      date_of_birth: new Date(payload.date_of_birth),
      password: hashPassword(payload.password),
      email_verify_token
    })

    await databaseService.user.insertOne(user)
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id,
        token: refresh_token
      })
    )

    // TODO: gửi email chứa email_verify_token cho user
    console.log('email_verify_token:', email_verify_token)

    return {
      access_token,
      refresh_token
    }
  }

  async getUserById(user_id: string) {
    return databaseService.user.findOne({ _id: new ObjectId(user_id) })
  }

  async verifyEmail(user_id: string) {
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token: '',
          verify: UserVerifyStatus.Verified,
          updated_at: new Date()
        }
      }
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return { access_token, refresh_token }
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token, updated_at: new Date() } }
    )
    console.log('resend email_verify_token:', email_verify_token)
  }

  async forgotPassword(user_id: string) {
    const forgot_password_token = await signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as any }
    })
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { forgot_password_token, updated_at: new Date() } }
    )
    console.log('forgot_password_token:', forgot_password_token)
  }

  async updateMe(user_id: string, payload: UpdateMeRequestBody) {
    const { date_of_birth, ...rest } = payload
    const updated = await databaseService.user.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...rest,
          ...(date_of_birth ? { date_of_birth: new Date(date_of_birth) } : {}),
          updated_at: new Date()
        }
      },
      { returnDocument: 'after', projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )
    return updated
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { password: hashPassword(new_password), updated_at: new Date() } }
    )
  }

  async resetPassword(user_id: string, password: string) {
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: new Date()
        }
      }
    )
  }
}

const userServices = new UserServices()
export default userServices
