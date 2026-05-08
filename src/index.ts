import express from 'express'

import usersRouter from './features/users/users.routes'
import tweetsRouter from './features/tweets/tweets.routes'
import likesRouter from './features/likes/likes.routes'
import bookmarksRouter from './features/bookmarks/bookmarks.routes'
import databaseService from './core/database/database.services'
import { defaultErrorsHandler } from './shared/middleware/error.middlewares'
import { setupSwagger } from './shared/utils/swagger'

const app = express()

databaseService.connect()

app.use(express.json())

app.use('/users', usersRouter)
app.use('/tweets', tweetsRouter)
app.use('/likes', likesRouter)
app.use('/bookmarks', bookmarksRouter)

setupSwagger(app)

app.use(defaultErrorsHandler)

app.listen(9990, () => {
  console.log('server is running on port 9990')
})
