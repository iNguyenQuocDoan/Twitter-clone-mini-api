import User from '~/model/schemas/User.shema'
import databaseService from './database.services'
class UsersService {
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

    async register(payload: { email: string; password: string }) {
        const { email, password } = payload
        // tao 1 user moi
        const result = await databaseService.users.insertOne(
            // dung cai user schema da tao ra
            new User({
                email,
                password
            })
        )

        return result
    }

    async checkEmailExists(email: string) {
        // kiểm tra xem cái email tồn tại hay chưa
        const user = await databaseService.users.findOne({ email });
        return Boolean(user);
    }
}

const usersService = new UsersService()
export default usersService
