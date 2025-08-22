import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { validate } from '~/utils/validation';

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
    next();
};

export const registerValidator = validate(
    checkSchema({
        name: {
            in: ['body'],
            notEmpty: true,
            isString: true,
            isLength: { options: { min: 1, max: 100 } },
            trim: true,
        },
        email: {
            in: ['body'],
            notEmpty: true,
            isEmail: true,
            trim: true,
        },
        password: {
            in: ['body'],
            notEmpty: true,
            isString: true,
            isLength: { options: { min: 6, max: 100 } },
            isStrongPassword: {
                options: {
                    minLength: 6,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1,
                },
                errorMessage: 'Password must be strong enough',
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
                    if (value !== req.body.password) throw new Error('Passwords do not match');
                    return true;
                },
            },
        },
        date_of_birth: {
            in: ['body'],
            isISO8601: { options: { strict: true, strictSeparator: true } },
            toDate: true,
        },
    })
);
