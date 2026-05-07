import { Request, Response } from 'express'
import { USER_MESSAGES } from '~/constants/message'
import likeServices from '~/services/likes.service'

const likeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.body
  const result = await likeServices.likeTweet(user_id, tweet_id)
  if (result === null) {
    return res.status(200).json({ message: USER_MESSAGES.ALREADY_LIKED })
  }
  return res.status(200).json({ message: USER_MESSAGES.LIKE_SUCCESS, result })
}

const unlikeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.params
  await likeServices.unlikeTweet(user_id, tweet_id)
  return res.status(200).json({ message: USER_MESSAGES.UNLIKE_SUCCESS })
}

export { likeTweetController, unlikeTweetController }
