import User from '~/model/schemas/User.shema'
import databaseService from './database.services'
import { RegisterRequestBody } from '~/model/requests/Users.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { EntityError } from '~/model/Errors'
import { USER_MESSAGES } from '~/constants/messages'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/model/schemas/RefreshToken.shema'
import { access } from 'fs'

class UsersService {
  // khai báo biến ở đây để sử dụng access token
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        algorithm: 'HS256',
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  // khai bao them refresh token
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        algorithm: 'HS256',
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  async login(payload: { email: string; password: string }) {
    console.log('Login service called with:', payload)

    // Tìm user theo email
    const user = await databaseService.users.findOne({ email: payload.email })

    if (!user) {
      throw new EntityError({
        message: USER_MESSAGES.INVALID_CREDENTIALS,
        errors: {
          email: {
            msg: USER_MESSAGES.USER_NOT_FOUND,
            value: payload.email
          }
        }
      })
    }

    // Kiểm tra password
    const hashedInputPassword = hashPassword(payload.password)
    if (hashedInputPassword !== user.password) {
      throw new EntityError({
        message: USER_MESSAGES.INVALID_CREDENTIALS,
        errors: {
          password: {
            msg: USER_MESSAGES.INVALID_CREDENTIALS,
            value: payload.password
          }
        }
      })
    }

    const user_id = user._id.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async register(payload: RegisterRequestBody) {
    console.log('Register service called with:', payload)

    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    // Kiểm tra email đã tồn tại chưa
    const isEmailExist = await this.checkEmailExists(payload.email)
    if (isEmailExist) {
      throw new EntityError({
        message: USER_MESSAGES.EMAIL_ALREADY_EXISTS,
        errors: {
          email: {
            msg: USER_MESSAGES.EMAIL_ALREADY_EXISTS,
            value: payload.email
          }
        }
      })
    }

    // Tạo user mới
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )

    console.log('Email Verify Token:', email_verify_token)

    return {
      user_id,
      access_token,
      refresh_token
    }
  }

  async logout(payload: { user_id: string; refresh_token: string }) {
    console.log('Logout service called with:', payload)

    // Xóa refresh token khỏi cơ sở dữ liệu
    await databaseService.users.updateOne(
      { _id: new ObjectId(payload.user_id) },
      { $pull: { refresh_tokens: payload.refresh_token } }
    )

    return {
      message: 'Logout successful'
    }
  }

  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
            // updated_at: new Date()
          },
          $currentDate: { updated_at: true }
        }
      )
    ])

    const [access_token, refresh_token] = token
    return {
      access_token,
      refresh_token
    }
  }
}

const usersService = new UsersService()
export default usersService
