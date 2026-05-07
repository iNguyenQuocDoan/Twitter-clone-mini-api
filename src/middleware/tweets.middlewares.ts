import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/message'
import { ErrorsWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [Object.values(TweetType).filter((v) => typeof v === 'number')],
          errorMessage: USER_MESSAGES.TWEET_TYPE_INVALID
        }
      },
      audience: {
        isIn: {
          options: [Object.values(TweetAudience).filter((v) => typeof v === 'number')],
          errorMessage: USER_MESSAGES.TWEET_AUDIENCE_INVALID
        }
      },
      content: {
        isString: true,
        trim: true,
        custom: {
          options: (value: string, { req }) => {
            const type = Number(req.body.type)
            if (type === TweetType.Retweet && value !== '') {
              throw new Error(USER_MESSAGES.TWEET_CONTENT_MUST_BE_EMPTY)
            }
            if ([TweetType.Tweet, TweetType.QuoteTweet, TweetType.Comment].includes(type) && value.trim() === '') {
              throw new Error(USER_MESSAGES.TWEET_CONTENT_IS_REQUIRED)
            }
            return true
          }
        }
      },
      parent_id: {
        optional: true,
        custom: {
          options: (value: string | null, { req }) => {
            const type = Number(req.body.type)
            if (type === TweetType.Tweet && value !== null && value !== undefined) {
              throw new Error(USER_MESSAGES.PARENT_ID_MUST_BE_NULL)
            }
            if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type)) {
              if (!value) throw new Error(USER_MESSAGES.PARENT_ID_IS_REQUIRED)
              if (!ObjectId.isValid(value)) throw new Error(USER_MESSAGES.TWEET_ID_INVALID)
            }
            return true
          }
        }
      },
      hashtags: {
        optional: true,
        isArray: true,
        custom: {
          options: (value: any[]) => {
            if (!value.every((item) => typeof item === 'string')) {
              throw new Error('Hashtags must be an array of strings')
            }
            return true
          }
        }
      },
      mentions: {
        optional: true,
        isArray: true,
        custom: {
          options: (value: any[]) => {
            if (!value.every((item) => ObjectId.isValid(item))) {
              throw new Error('Mentions must be an array of valid user ids')
            }
            return true
          }
        }
      },
      medias: {
        optional: true,
        isArray: true,
        custom: {
          options: (value: any[]) => {
            if (!value.every((item) => typeof item.url === 'string' && ['image', 'video'].includes(item.type))) {
              throw new Error('Medias must be an array of {url: string, type: "image" | "video"}')
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value: string, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorsWithStatus({ message: USER_MESSAGES.TWEET_ID_INVALID, status: HTTP_STATUS.BAD_REQUEST })
            }
            const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(value) })
            if (!tweet) {
              throw new ErrorsWithStatus({ message: USER_MESSAGES.TWEET_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
            }
            ;(req as any).tweet = tweet
            return true
          }
        }
      }
    },
    ['params']
  )
)

export { createTweetValidator, tweetIdValidator }
