import express from 'express'
import usersRouter from './routes/users.route'
import databaseService from './services/database.services'
const app = express()

// phải chạy qua được cái middleware này 
// chuyển thành dạng json
app.use(express.json())

// Sử dụng router với prefix /user
// cũng có thể hiểu được đây là 1 cái tiền tố
app.use('/users', usersRouter)

// connect db vào đây
databaseService.connect()

app.listen(9990, () => {
    console.log("server is running on port 9990")
})