import { Request, Response } from 'express'
import { USER_MESSAGES } from '../../shared/constants/message'
import likeServices from './likes.service'
import { successResponse } from '../../shared/utils/response'

const likeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.body
  const result = await likeServices.likeTweet(user_id, tweet_id)
  if (result === null) {
    return res.status(200).json(successResponse(null, USER_MESSAGES.ALREADY_LIKED))
  }
  return res.status(201).json(successResponse(result, USER_MESSAGES.LIKE_SUCCESS))
}

const unlikeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { tweet_id } = req.params
  await likeServices.unlikeTweet(user_id, tweet_id)
  return res.status(204).send()
}

export { likeTweetController, unlikeTweetController }
