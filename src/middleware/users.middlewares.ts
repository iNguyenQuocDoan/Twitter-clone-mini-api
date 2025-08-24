import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { USER_MESSAGES } from '~/constants/messages';
import usersService from '~/services/users.services';
import { validate } from '~/utils/validation';

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
    checkSchema(
        {
            email: {
                in: ['body'],
                notEmpty: {
                    errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED,
                },
                isEmail: {
                    errorMessage: USER_MESSAGES.EMAIL_IS_NOT_VALID,
                },
                trim: true,
                custom: {
                    options: async (value) => {
                        // import tu cai usersService vao de kiem ra co email hay chua
                        const isExist = await usersService.checkEmailExists(value)
                        // throw error neu email exists
                        if (isExist) { throw new Error(USER_MESSAGES.NOT_FOUND) }
                        return true
                    }
                }
            },
            password: {
                in: ['body'],
                notEmpty: {
                    errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED,
                },
                isString: {
                    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING,
                },
                isLength: { options: { min: 6, max: 100 }, errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_100 },
                isStrongPassword: {
                    options: {
                        minLength: 6,
                        minLowercase: 1,
                        minUppercase: 1,
                        minNumbers: 1,
                        minSymbols: 1,
                    },
                    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG,
                },
                trim: true,
            },
        }
    )
};

export const registerValidator = validate(
    checkSchema({
        name: {
            in: ['body'],
            notEmpty: {
                errorMessage: USER_MESSAGES.NAME_IS_REQUIRED,
            },
            isString: {
                errorMessage: USER_MESSAGES.NAME_MUST_BE_STRING,
            },
            isLength: { options: { min: 1, max: 100 }, errorMessage: USER_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100 },
            trim: true,
        },
        email: {
            in: ['body'],
            notEmpty: {
                errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED,
            },
            isEmail: {
                errorMessage: USER_MESSAGES.EMAIL_IS_NOT_VALID,
            },
            trim: true,
            custom: {
                options: async (value) => {
                    // import tu cai usersService vao de kiem ra co email hay chua
                    const isExist = await usersService.checkEmailExists(value)
                    // throw error neu email exists
                    if (isExist) { throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXISTS) }
                    return true
                }
            }
        },
        password: {
            in: ['body'],
            notEmpty: {
                errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED,
            },
            isString: {
                errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRING,
            },
            isLength: { options: { min: 6, max: 100 }, errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_100 },
            isStrongPassword: {
                options: {
                    minLength: 6,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1,
                },
                errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG,
            },
            trim: true,
        },
        confirm_password: {
            in: ['body'],
            notEmpty: true,
            isString: true,
            isLength: { options: { min: 6, max: 100 } },
            // kiểm tra khớp với password
            custom: {
                options: (value, { req }) => {
                    if (value !== req.body.password) throw new Error(USER_MESSAGES.CONFIRM_PASSWORD_MUST_MATCH);
                    return true;
                },
            },
        },
        date_of_birth: {
            in: ['body'],
            isISO8601: { options: { strict: true, strictSeparator: true }, errorMessage: USER_MESSAGES.DATE_OF_BIRTH_IS_NOT_VALID },
            toDate: true,
        },
    })
);
