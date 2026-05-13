import { ObjectId } from 'mongodb'
import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { enrichmentStages } from './tweets.service'

class BookmarkServices {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const existing = await databaseService.bookmarks.findOne({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    if (existing) return null

    const result = await databaseService.bookmarks.insertOne(
      new Bookmark({ user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) })
    )
    return databaseService.bookmarks.findOne({ _id: result.insertedId })
  }

  async unbookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.deleteOne({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return result.deletedCount > 0
  }

  /**
   * List bookmarks of a user, sorted by most-recently bookmarked.
   * Each row is the enriched tweet — same shape as timeline so FE reuses TweetCard.
   */
  async listBookmarks(user_id: string, page: number, limit: number) {
    const userObjectId = new ObjectId(user_id)
    const baseMatch = { user_id: userObjectId }

    const [rows, total] = await Promise.all([
      databaseService.bookmarks
        .aggregate([
          { $match: baseMatch },
          { $sort: { created_at: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          // attach the tweet doc and unwrap it
          {
            $lookup: {
              from: 'tweets',
              localField: 'tweet_id',
              foreignField: '_id',
              as: '__tweet',
            },
          },
          { $unwind: '$__tweet' },
          { $replaceRoot: { newRoot: '$__tweet' } },
          ...enrichmentStages(user_id),
        ])
        .toArray(),
      databaseService.bookmarks.countDocuments(baseMatch),
    ])

    return { tweets: rows, total, page, limit, total_pages: Math.ceil(total / limit) }
  }
}

const bookmarkServices = new BookmarkServices()
export default bookmarkServices
