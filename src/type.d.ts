import { Request } from 'express'
import { TokenPayload } from './model/requests/Users.requests'
import User from './model/schemas/User.shema'

declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
  }
}
