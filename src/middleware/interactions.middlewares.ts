import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { ERROR_CODE } from '~/constants/errorCode'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/message'
import { ErrorsWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

const tweetIdBodyValidator = validate(
  checkSchema(
    {
      tweet_id: {
        trim: true,
        custom: {
          options: async (value: string) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorsWithStatus({ message: USER_MESSAGES.TWEET_ID_INVALID, status: HTTP_STATUS.BAD_REQUEST, code: ERROR_CODE.TWEET_002 })
            }
            const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(value) })
            if (!tweet) {
              throw new ErrorsWithStatus({ message: USER_MESSAGES.TWEET_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND, code: ERROR_CODE.TWEET_001 })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

const tweetIdParamValidator = validate(
  checkSchema(
    {
      tweet_id: {
        trim: true,
        custom: {
          options: async (value: string) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorsWithStatus({ message: USER_MESSAGES.TWEET_ID_INVALID, status: HTTP_STATUS.BAD_REQUEST, code: ERROR_CODE.TWEET_002 })
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)

export { tweetIdBodyValidator, tweetIdParamValidator }
