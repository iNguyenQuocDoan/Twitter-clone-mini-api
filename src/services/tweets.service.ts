import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enums'
import { CreateTweetRequestBody } from '~/models/requests/Tweet.requests'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from './database.services'

class TweetServices {
  async createTweet(user_id: string, body: CreateTweetRequestBody) {
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        ...body,
        user_id: new ObjectId(user_id),
        parent_id: body.parent_id ? new ObjectId(body.parent_id) : null,
        mentions: body.mentions ? body.mentions.map((id) => new ObjectId(id)) : []
      })
    )
    return databaseService.tweets.findOne({ _id: result.insertedId })
  }

  async getTweet(tweet_id: string, is_authenticated: boolean) {
    const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })
    if (!tweet) return null

    const viewField = is_authenticated ? 'user_views' : 'guest_views'
    await databaseService.tweets.updateOne(
      { _id: new ObjectId(tweet_id) },
      { $inc: { [viewField]: 1 }, $set: { updated_at: new Date() } }
    )

    return { ...tweet, [viewField]: (tweet[viewField] || 0) + 1 }
  }

  async getTimeline(user_id: string, page: number, limit: number) {
    const followed = await databaseService.followers
      .find({ user_id: new ObjectId(user_id) }, { projection: { followed_user_id: 1 } })
      .toArray()

    const followed_user_ids = followed.map((f) => f.followed_user_id)
    followed_user_ids.push(new ObjectId(user_id))

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .find({
          user_id: { $in: followed_user_ids },
          type: TweetType.Tweet
        })
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      databaseService.tweets.countDocuments({
        user_id: { $in: followed_user_ids },
        type: TweetType.Tweet
      })
    ])

    await databaseService.tweets.updateMany(
      { _id: { $in: tweets.map((t) => t._id as ObjectId) } },
      { $inc: { user_views: 1 }, $set: { updated_at: new Date() } }
    )

    return { tweets, total, page, limit, total_pages: Math.ceil(total / limit) }
  }
}

const tweetServices = new TweetServices()
export default tweetServices
