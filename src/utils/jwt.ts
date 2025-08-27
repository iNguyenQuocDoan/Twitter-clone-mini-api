import jwt from 'jsonwebtoken'

export const signToken = ({ payload, privateKey = process.env.JWT_SECRET as string, options = { algorithm: 'HS256' } }: { payload: any, privateKey?: string, options?: jwt.SignOptions }) => {
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

export const verifyToken = ({ token, publicKey = process.env.JWT_SECRET as string, options = {} }: { token: string, publicKey?: string, options?: jwt.VerifyOptions }) => {
    return new Promise<jwt.JwtPayload>((resolve, reject) => {
        jwt.verify(token, publicKey, options || {}, (err, decoded) => {
            if (err || !decoded) {
                console.error('Error verifying token:', err)
                return reject(err)
            }
            resolve(decoded as jwt.JwtPayload)
        })
    })
}
