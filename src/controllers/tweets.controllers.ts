import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { USER_MESSAGES } from '~/constants/message'
import { CreateTweetRequestBody } from '~/models/requests/Tweet.requests'
import tweetServices from '~/services/tweets.service'

const createTweetController = async (req: Request<ParamsDictionary, any, CreateTweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const result = await tweetServices.createTweet(user_id, req.body)
  return res.status(201).json({ message: USER_MESSAGES.CREATE_TWEET_SUCCESS, result })
}

const getTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const is_authenticated = Boolean(req.decoded_authorization)
  const result = await tweetServices.getTweet(tweet_id, is_authenticated)
  return res.status(200).json({ message: USER_MESSAGES.GET_TWEET_SUCCESS, result })
}

const getTimelineController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const page = Number(req.query.page) || 1
  const limit = Math.min(Number(req.query.limit) || 10, 100)
  const result = await tweetServices.getTimeline(user_id, page, limit)
  return res.status(200).json({ message: USER_MESSAGES.GET_TIMELINE_SUCCESS, result })
}

export { createTweetController, getTweetController, getTimelineController }
