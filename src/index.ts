import express from 'express'

import usersRouter from '~/routes/users.route'
import tweetsRouter from '~/routes/tweets.route'
import likesRouter from '~/routes/likes.route'
import bookmarksRouter from '~/routes/bookmarks.route'
import databaseService from '~/services/database.services'
import { defaultErrorsHandler } from '~/middleware/error.middlewares'
import { setupSwagger } from '~/utils/swagger'

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
