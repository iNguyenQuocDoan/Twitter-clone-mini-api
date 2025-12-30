import express from 'express'
import { NextFunction, Request, Response } from 'express-serve-static-core'

import usersRouter from './routes/users.route'
import databaseService from './services/database.services'

const app = express()

// phải chạy qua được cái middleware này
// chuyển thành dạng json
app.use(express.json())

// handler lỗi
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({
    error: err.message || 'Something went wrong'
  })
})

// Sử dụng router với prefix /user
// cũng có thể hiểu được đây là 1 cái tiền tố
app.use('/users', usersRouter)

// connect db vào đây
databaseService.connect()

app.listen(9990, () => {
  console.log('server is running on port 9990')
})
