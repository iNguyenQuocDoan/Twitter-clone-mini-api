import { MongoClient, ServerApiVersion } from 'mongodb';
import { config } from 'dotenv'

// import cái này vào để đọc được mây cái biến ở env
config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.uerz2au.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

class DatabaseService {
    private client: MongoClient

    constructor() {
        this.client = new MongoClient(uri)
    }

    // biến để tạo ra để có thể kết nối được Db
    async connect() {
        try {
            // Connect the client to the server	(optional starting in v4.7)
            await this.client.connect();
            // Send a ping to confirm a successful connection
            await this.client.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
        } catch (err) {
            console.log("Failed connected to MongoDB", err)
        }
    }

}

// tạo 1 obj từ class Database
const databaseService = new DatabaseService()
export default databaseService


