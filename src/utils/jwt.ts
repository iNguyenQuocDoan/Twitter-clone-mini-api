import jwt from 'jsonwebtoken'

export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: any
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options || {}, (err, token) => {
      if (err || !token) {
        console.error('Error signing token:', err)
        return reject(err)
      }
      resolve(token)
    })
  })
}

export const verifyToken = ({
  token,
  secretOrPublicKey,
  options = {}
}: {
  token: string
  secretOrPublicKey: string
  options?: jwt.VerifyOptions
}) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, options || {}, (err, decoded) => {
      if (err || !decoded) {
        console.error('Error verifying token:', err)
        return reject(err)
      }
      resolve(decoded as jwt.JwtPayload)
    })
  })
}
