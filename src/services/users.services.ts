import User from "~/model/schemas/User.shema"
import databaseService from "./database.services"
class UsersService {

    async login(payload: { email: string, password: string }) {
        const { email, password } = payload;

        if (email === "nguyenquocdoan@gmail.com" && password === '123') {
            return {
                message: "login success"
            }
        } else {
            return {
                error: "login failed"
            }
        }
    }

    async register(payload: { email: string, password: string }) {
        const { email, password } = payload;
        const result = await databaseService.users.insertOne(new User({
            email,
            password
        }))

        return result
    }
}

const usersService = new UsersService()
export default usersService