import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb'
import { config } from 'dotenv'
import User from '~/model/schemas/User.shema'
import RefreshToken from '~/model/schemas/RefreshToken.shema'

// import cái này vào để đọc được mây cái biến ở env
config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.uerz2au.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME || 'twitter-dev')
  }

  // biến để tạo ra để có thể kết nối được Db
  async connect() {
    try {
      // tạo 1 cái instance để kết nối đến db
      const db = this.client.db('twitter-dev')

      // Connect the client to the server	(optional starting in v4.7)
      await this.client.connect()
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (err) {
      console.log('Failed connected to MongoDB', err)
    }
  }
  //getter để lấy ra collection users
  get users(): Collection<User> {
    return this.db.collection(process.env.USER_COLLECTION || 'users')
  }

  // refresh token
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.REFRESH_TOKEN_COLLECTION || 'refresh_tokens')
  }
}

// tạo 1 obj từ class Database
const databaseService = new DatabaseService()
export default databaseService
