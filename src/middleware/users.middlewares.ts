import { checkSchema } from 'express-validator'
import { StringToNumber } from 'lodash'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/message'
import { ErrorsWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'

import userServices from '~/services/users.service'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.NAME_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USER_MESSAGES.NAME_LENGTH_INVALID
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: true,
        trim: true,
        custom: {
          options: async (value) => {
            const user = await databaseService.user.findOne({ email: value })
            if (user) {
              throw new Error(USER_MESSAGES.EMAIL_ALREADY_IN_USE)
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          }
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: 'Password is not strong enough'
        },
        trim: true
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_INVALID
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_NOT_STRONG_ENOUGH
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGES.PASSWORD_CONFIRMATION_DOES_NOT_MATCH)
            }
            return true
          }
        },
        trim: true
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ['body']
  )
)

const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_MUST_BE_VALID
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.user.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (!user) {
              throw new Error(USER_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: USER_MESSAGES.PASSWORD_LENGTH_INVALID
        },
        trim: true
      }
    },
    ['body']
  )
)

const accessTokenValidator = validate(
  checkSchema(
    {
      notEmpty: {
        errorMessage: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      },
      authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            const decoded_authorization = await verifyToken({ token: access_token })
            req.decoded_authorization = decoded_authorization
            return true
          }
        }
      }
    },
    ['headers']
  )
)

const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value }),
                databaseService.refreshTokens.findOne({ token: value })
              ])

              if (refresh_token == null) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGES.REFRESH_TOKEN_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              req.decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof ErrorsWithStatus) {
                throw error
              }
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.REFRESH_TOKEN_INVALID,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export { loginValidator, registerValidator, accessTokenValidator, refreshTokenValidator }
