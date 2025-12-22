import User from '~/models/schemas/User.schema'
import databaseService from './database.services'

class UserServices {
  async register(payload: { email: string; password: string }) {
    const { email, password } = payload
    const user = new User({
      email: payload.email,
      password: payload.password
    })
    const result = await databaseService.user.insertOne(user)
  }
}

const userServices = new UserServices()
export default userServices
