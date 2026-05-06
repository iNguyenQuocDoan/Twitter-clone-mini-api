import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/message'
import { ErrorsWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
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

const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              req.decoded_email_verify_token = decoded_email_verify_token
            } catch {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.EMAIL_VERIFY_TOKEN_INVALID,
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

const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: { errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED },
        isEmail: { errorMessage: USER_MESSAGES.EMAIL_MUST_BE_VALID },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.user.findOne({ email: value })
            if (!user) {
              throw new ErrorsWithStatus({ message: USER_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

const forgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              const user = await databaseService.user.findOne({ _id: new ObjectId(decoded.user_id as string) })
              if (!user || user.forgot_password_token !== value) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              req.decoded_forgot_password_token = decoded
            } catch (error) {
              if (error instanceof ErrorsWithStatus) throw error
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_INVALID,
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

const resetPasswordValidator = validate(
  checkSchema(
    {
      password: {
        notEmpty: { errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED },
        isString: { errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING },
        isLength: { options: { min: 6, max: 50 }, errorMessage: USER_MESSAGES.PASSWORD_LENGTH_INVALID },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
          errorMessage: USER_MESSAGES.PASSWORD_NOT_STRONG_ENOUGH
        },
        trim: true
      },
      confirm_password: {
        notEmpty: { errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED },
        isString: { errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRING },
        isLength: { options: { min: 6, max: 50 }, errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_INVALID },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
          errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_NOT_STRONG_ENOUGH
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) throw new Error(USER_MESSAGES.PASSWORD_CONFIRMATION_DOES_NOT_MATCH)
            return true
          }
        },
        trim: true
      },
      forgot_password_token: {
        trim: true,
        notEmpty: { errorMessage: USER_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED }
      }
    },
    ['body']
  )
)

const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        isString: { errorMessage: USER_MESSAGES.NAME_MUST_BE_STRING },
        isLength: { options: { min: 1, max: 100 }, errorMessage: USER_MESSAGES.NAME_LENGTH_INVALID },
        trim: true
      },
      date_of_birth: {
        optional: true,
        isISO8601: {
          options: { strict: true, strictSeparator: true },
          errorMessage: USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      },
      bio: {
        optional: true,
        isString: true,
        isLength: { options: { max: 200 } },
        trim: true
      },
      location: {
        optional: true,
        isString: true,
        isLength: { options: { max: 200 } },
        trim: true
      },
      website: {
        optional: true,
        isString: true,
        isURL: true,
        trim: true
      },
      username: {
        optional: true,
        isString: true,
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!/^[a-zA-Z0-9_]{4,15}$/.test(value)) {
              throw new Error(USER_MESSAGES.USERNAME_INVALID)
            }
            const existing = await databaseService.user.findOne({ username: value })
            if (existing && existing._id.toString() !== (req.decoded_authorization as any).user_id) {
              throw new Error(USER_MESSAGES.USERNAME_ALREADY_IN_USE)
            }
            return true
          }
        }
      },
      avatar: {
        optional: true,
        isString: true,
        isURL: true,
        trim: true
      },
      cover_photo: {
        optional: true,
        isString: true,
        isURL: true,
        trim: true
      }
    },
    ['body']
  )
)

const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        notEmpty: { errorMessage: USER_MESSAGES.OLD_PASSWORD_IS_REQUIRED },
        isString: true,
        trim: true
      },
      password: {
        notEmpty: { errorMessage: USER_MESSAGES.NEW_PASSWORD_IS_REQUIRED },
        isString: { errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING },
        isLength: { options: { min: 6, max: 50 }, errorMessage: USER_MESSAGES.PASSWORD_LENGTH_INVALID },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
          errorMessage: USER_MESSAGES.PASSWORD_NOT_STRONG_ENOUGH
        },
        trim: true
      },
      confirm_password: {
        notEmpty: { errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED },
        isString: { errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRING },
        isLength: { options: { min: 6, max: 50 }, errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_INVALID },
        isStrongPassword: {
          options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
          errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_NOT_STRONG_ENOUGH
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) throw new Error(USER_MESSAGES.PASSWORD_CONFIRMATION_DOES_NOT_MATCH)
            return true
          }
        },
        trim: true
      }
    },
    ['body']
  )
)

const followValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.FOLLOWED_USER_ID_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            if (!ObjectId.isValid(value)) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.FOLLOWED_USER_ID_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const followed_user = await databaseService.user.findOne({ _id: new ObjectId(value) })
            if (!followed_user) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.FOLLOWED_USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            const { user_id } = (req as any).decoded_authorization
            if (value === user_id) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGES.CANNOT_FOLLOW_YOURSELF,
                status: HTTP_STATUS.BAD_REQUEST
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

export {
  loginValidator,
  registerValidator,
  accessTokenValidator,
  refreshTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  forgotPasswordTokenValidator,
  resetPasswordValidator,
  updateMeValidator,
  changePasswordValidator,
  followValidator
}
