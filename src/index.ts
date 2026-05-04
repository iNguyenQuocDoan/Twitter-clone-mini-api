import express from 'express'

import usersRouter from './routes/users.route'
import databaseService from './services/database.services'
import { defaultErrorsHandler } from './middleware/error.middlewares'
import { setupSwagger } from './utils/swagger'

const app = express()

// connect db vào đây
databaseService.connect()

// phải chạy qua được cái middleware này
// chuyển thành dạng json
app.use(express.json())

// Sử dụng router với prefix /user
// cũng có thể hiểu được đây là 1 cái tiền tố
app.use('/users', usersRouter)

setupSwagger(app)

// handler lỗi - phải đặt sau tất cả routes
app.use(defaultErrorsHandler)

app.listen(9990, () => {
  console.log('server is running on port 9990')
})
