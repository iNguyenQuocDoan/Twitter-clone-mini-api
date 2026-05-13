import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { UserRole, UserVerifyStatus } from '~/constants/enums'

interface UpdateUserPayload {
  role?: UserRole
  verify?: UserVerifyStatus
}

interface ListUsersFilter {
  page: number
  limit: number
  search?: string
}

class AdminServices {
  async getStats() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      total_users,
      total_admins,
      total_banned,
      total_tweets,
      total_likes,
      total_bookmarks,
      new_users_today,
      new_tweets_today,
    ] = await Promise.all([
      databaseService.user.countDocuments({}),
      databaseService.user.countDocuments({ role: UserRole.Admin }),
      databaseService.user.countDocuments({ verify: UserVerifyStatus.Banned }),
      databaseService.tweets.countDocuments({}),
      databaseService.likes.countDocuments({}),
      databaseService.bookmarks.countDocuments({}),
      databaseService.user.countDocuments({ created_at: { $gte: todayStart } }),
      databaseService.tweets.countDocuments({ created_at: { $gte: todayStart } }),
    ])

    return {
      total_users,
      total_admins,
      total_banned,
      total_tweets,
      total_likes,
      total_bookmarks,
      new_users_today,
      new_tweets_today,
    }
  }

  async listUsers({ page, limit, search }: ListUsersFilter) {
    const filter: Record<string, unknown> = {}
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = { $regex: escaped, $options: 'i' }
      filter.$or = [{ name: regex }, { username: regex }, { email: regex }]
    }

    const projection = {
      password: 0,
      email_verify_token: 0,
      forgot_password_token: 0,
    }

    const [users, total] = await Promise.all([
      databaseService.user
        .find(filter, { projection })
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      databaseService.user.countDocuments(filter),
    ])

    return { users, total, page, limit, total_pages: Math.ceil(total / limit) }
  }

  async updateUser(target_id: string, payload: UpdateUserPayload) {
    const updateDoc: Record<string, unknown> = { updated_at: new Date() }
    if (payload.role !== undefined) updateDoc.role = payload.role
    if (payload.verify !== undefined) updateDoc.verify = payload.verify

    const projection = {
      password: 0,
      email_verify_token: 0,
      forgot_password_token: 0,
    }

    const result = await databaseService.user.findOneAndUpdate(
      { _id: new ObjectId(target_id) },
      { $set: updateDoc },
      { returnDocument: 'after', projection },
    )
    return result
  }
}

const adminServices = new AdminServices()
export default adminServices
