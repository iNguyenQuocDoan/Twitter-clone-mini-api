import { checkSchema } from 'express-validator'
import { USER_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
import { ObjectId } from 'mongodb'

export const loginValidator = validate(
    checkSchema(
        {
            email: {
                isEmail: {
                    errorMessage: USER_MESSAGES.EMAIL_IS_NOT_VALID
                },
                trim: true
                // Bỏ custom validation ở đây vì sẽ check trong service
            },
            password: {
                isString: {
                    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
                },
                isLength: {
                    options: {
                        min: 6,
                        max: 100
                    },
                    errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_100
                },
                trim: true
            }
        },
        ['body']
    )
)

export const registerValidator = validate(
    checkSchema({
        name: {
            in: ['body'],
            notEmpty: {
                errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
            },
            isString: {
                errorMessage: USER_MESSAGES.NAME_MUST_BE_STRING
            },
            isLength: { options: { min: 1, max: 100 }, errorMessage: USER_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100 },
            trim: true
        },
        email: {
            in: ['body'],
            notEmpty: {
                errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
            },
            isEmail: {
                errorMessage: USER_MESSAGES.EMAIL_IS_NOT_VALID
            },
            trim: true,
            custom: {
                options: async (value) => {
                    // import tu cai usersService vao de kiem ra co email hay chua
                    const isExist = await usersService.checkEmailExists(value)
                    // throw error neu email exists
                    if (isExist) {
                        throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXISTS)
                    }
                    return true
                }
            }
        },
        password: {
            in: ['body'],
            notEmpty: {
                errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
            },
            isString: {
                errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING
            },
            isLength: { options: { min: 6, max: 100 }, errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_100 },
            isStrongPassword: {
                options: {
                    minLength: 6,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                },
                errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
            },
            trim: true
        },
        confirm_password: {
            in: ['body'],
            notEmpty: true,
            isString: true,
            isLength: { options: { min: 6, max: 100 } },
            // kiểm tra khớp với password
            custom: {
                options: (value, { req }) => {
                    if (value !== req.body.password) throw new Error(USER_MESSAGES.CONFIRM_PASSWORD_MUST_MATCH)
                    return true
                }
            }
        },
        date_of_birth: {
            in: ['body'],
            isISO8601: {
                options: { strict: true, strictSeparator: true },
                errorMessage: USER_MESSAGES.DATE_OF_BIRTH_IS_NOT_VALID
            },
            toDate: true
        }
    })
)

export const accessTokenValidator = validate(
    checkSchema(
        {
            authorization: {
                notEmpty: {
                    errorMessage: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
                },
                custom: {
                    options: async (value: string, { req }) => {
                        const access_token = value.replace('Bearer ', '')

                        try {
                            // Verify token với JWT secret
                            const decoded = await verifyToken({ token: access_token })

                            // Tìm user theo user_id trong token
                            const user = await databaseService.users.findOne({
                                _id: new ObjectId(decoded.user_id)
                            })

                            if (!user) {
                                throw new Error(USER_MESSAGES.USER_NOT_FOUND)
                            }

                            // Gắn user và decoded token vào req
                            req.user = user
                            req.decoded_authorization = decoded
                            return true
                        } catch (error) {
                            throw new Error(USER_MESSAGES.INVALID_ACCESS_TOKEN)
                        }
                    }
                }
            }
        },
        ['headers']
    )
)

export const refreshTokenValidator = validate(
    checkSchema(
        {
            refresh_token: {
                notEmpty: {
                    errorMessage: 'Refresh token is required'
                },
                custom: {
                    options: async (value: string, { req }) => {
                        try {
                            const decoded = await verifyToken({ token: value })
                            req.decoded_refresh_token = decoded
                            return true
                        } catch (error) {
                            throw new Error('Invalid refresh token')
                        }
                    }
                }
            }
        },
        ['body']
    )
)
