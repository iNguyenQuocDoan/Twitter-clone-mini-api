import express from 'express'
import http from 'http'
import cors from 'cors'

import usersRouter from '~/routes/users.route'
import tweetsRouter from '~/routes/tweets.route'
import likesRouter from '~/routes/likes.route'
import bookmarksRouter from '~/routes/bookmarks.route'
import adminRouter from '~/routes/admin.route'
import messagesRouter from '~/routes/messages.route'
import databaseService from '~/services/database.services'
import { defaultErrorsHandler } from '~/middleware/error.middlewares'
import { setupSwagger } from '~/utils/swagger'
import { setupSocket } from '~/socket/io'

const app = express()

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())

app.use('/users', usersRouter)
app.use('/tweets', tweetsRouter)
app.use('/likes', likesRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/conversations', messagesRouter)
app.use('/admin', adminRouter)

setupSwagger(app)

app.use(defaultErrorsHandler)

const httpServer = http.createServer(app)
setupSocket(httpServer)

databaseService
  .connect()
  .then(() => {
    httpServer.listen(9990, () => {
      console.log('server is running on port 9990 (HTTP + WebSocket)')
    })
  })
  .catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
  })
