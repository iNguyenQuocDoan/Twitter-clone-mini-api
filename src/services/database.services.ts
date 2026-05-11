import { Collection, Db, MongoClient } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import { RefreshToken } from '~/models/RefreshToken'
import Follower from '~/models/schemas/Follower.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Like from '~/models/schemas/Like.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'

// import cái này vào để đọc được mây cái biến ở env
config()

// Ưu tiên MONGO_URI (local). Fallback sang Atlas khi có DB_USERNAME/DB_PASSWORD.
const uri =
  process.env.MONGO_URI ||
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.uerz2au.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(`${process.env.DB_NAME}`)
  }

  // biến để tạo ra để có thể kết nối được Db
  async connect() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await this.client.connect()
      // Send a ping to confirm a successful connection
      await this.client.db('admin').command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (err) {
      console.log('Failed connected to MongoDB', err)
    }
  }

  get user(): Collection<User> {
    return this.db.collection(process.env.USER_COLLECTION as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.REFRESH_TOKEN_COLLECTION as string)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.FOLLOWER_COLLECTION as string)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.TWEET_COLLECTION as string)
  }

  get likes(): Collection<Like> {
    return this.db.collection(process.env.LIKE_COLLECTION as string)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(process.env.BOOKMARK_COLLECTION as string)
  }
}

// tạo 1 obj từ class Database
const databaseService = new DatabaseService()
export default databaseService
