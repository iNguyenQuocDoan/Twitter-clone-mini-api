import { Request, Response } from 'express'
import { USER_MESSAGES } from '~/constants/message'
import bookmarkServices from '~/services/bookmarks.service'

const bookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.body
  const result = await bookmarkServices.bookmarkTweet(user_id, tweet_id)
  if (result === null) {
    return res.status(200).json({ message: USER_MESSAGES.ALREADY_BOOKMARKED })
  }
  return res.status(200).json({ message: USER_MESSAGES.BOOKMARK_SUCCESS, result })
}

const unbookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.params
  await bookmarkServices.unbookmarkTweet(user_id, tweet_id)
  return res.status(200).json({ message: USER_MESSAGES.UNBOOKMARK_SUCCESS })
}

export { bookmarkTweetController, unbookmarkTweetController }
