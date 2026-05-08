import { Request, Response } from 'express'
import { USER_MESSAGES } from '~/constants/message'
import bookmarkServices from '~/services/bookmarks.service'
import { successResponse } from '~/utils/response'

const bookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.body
  const result = await bookmarkServices.bookmarkTweet(user_id, tweet_id)
  if (result === null) {
    return res.status(200).json(successResponse(null, USER_MESSAGES.ALREADY_BOOKMARKED))
  }
  return res.status(201).json(successResponse(result, USER_MESSAGES.BOOKMARK_SUCCESS))
}

const unbookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.params
  await bookmarkServices.unbookmarkTweet(user_id, tweet_id)
  return res.status(204).send()
}

export { bookmarkTweetController, unbookmarkTweetController }
