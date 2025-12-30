import jwt, { SignOptions } from 'jsonwebtoken'
import { config } from 'dotenv'

config()

const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET_ACCESS_TOKEN as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey?: string
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) reject(error)
      else resolve(token as string)
    })
  })
}

signToken({
  payload: {},
  options: {
    algorithm: 'HS256',
    expiresIn: '1h'
  }
})

export { signToken }
