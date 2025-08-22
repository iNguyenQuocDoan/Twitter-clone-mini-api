import { createHash } from 'crypto'

function sha256(content: string) {
    return createHash('sha256').update(content).digest('hex')
}
// Hàm băm mật khẩu + tăng cường độ bảo mật
export const hashPassword = (password: string) => {
    return sha256(password + process.env.PASSWORD_SECRET)
}
