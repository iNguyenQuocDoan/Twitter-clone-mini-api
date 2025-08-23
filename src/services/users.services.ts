import User from '~/model/schemas/User.shema'
import databaseService from './database.services'
import { RegisterRequestBody } from '~/model/requests/Users.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'

class UsersService {
    // khai báo biến ở đây để sử dụng access token
    private signAccessToken(user_id: string) {
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.AccessToken
            },
            options: {
                algorithm: 'HS256',
                expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as any
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
            options: {
                algorithm: 'HS256',
                expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as any
            }
        })
    }


    async login(payload: { email: string; password: string }) {
        const { email, password } = payload
        if (email === 'nguyenquocdoan@gmail.com' && password === '123') {
            return {
                message: 'login success'
            }
        } else {
            return {
                error: 'login failed'
            }
        }
    }

    // quy định lại kiểu dữ liệu cho payload
    async register(payload: RegisterRequestBody) {
        // tao 1 user moi
        const result = await databaseService.users.insertOne(
            // dung cai user schema da tao ra
            new User({
                ...payload,
                // convert date_of_birth
                date_of_birth: new Date(payload.date_of_birth),
                // hash password
                password: hashPassword(payload.password)
            })
        )
        const user_id = result.insertedId.toString()

        const access_token = await this.signAccessToken(user_id)
        const refresh_token = await this.signRefreshToken(user_id)

        return {
            user_id,
            access_token,
            refresh_token
        }

    }

    async checkEmailExists(email: string) {
        // kiểm tra xem cái email tồn tại hay chưa
        const user = await databaseService.users.findOne({ email })
        return Boolean(user)
    }
}

const usersService = new UsersService()
export default usersService
