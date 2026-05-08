import { ObjectId } from 'mongodb'
import Bookmark from './models/Bookmark.schema'
import databaseService from '../../core/database/database.services'

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
}

const bookmarkServices = new BookmarkServices()
export default bookmarkServices
