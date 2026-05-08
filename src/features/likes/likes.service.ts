import { ObjectId } from 'mongodb'
import Like from './models/Like.schema'
import databaseService from '../../core/database/database.services'

class LikeServices {
  async likeTweet(user_id: string, tweet_id: string) {
    const existing = await databaseService.likes.findOne({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    if (existing) return null

    const result = await databaseService.likes.insertOne(
      new Like({ user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) })
    )
    return databaseService.likes.findOne({ _id: result.insertedId })
  }

  async unlikeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.deleteOne({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return result.deletedCount > 0
  }
}

const likeServices = new LikeServices()
export default likeServices
