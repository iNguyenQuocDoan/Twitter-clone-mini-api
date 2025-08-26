import express from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';
import HTTP_STATUS from '~/constants/httpStatus';

import { EntityError, ErrorWithStatus } from '~/model/Errors';


// can be reused by many routes
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // sequential processing, stops running validations chain if one fails.
        await validations.run(req);
        const errors = validationResult(req);
        const errorObject = errors.mapped();
        const entityErrors = new EntityError({ errors: {} });
        // co loi thi tra ra
        if (!errors.isEmpty()) {
            // trả về lỗi không phải do validation thông thường
            for (const key in errorObject) {
                const { msg } = errorObject[key];
                if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
                    return next(msg);
                }

                entityErrors.errors[key] = msg;
            }

            // Trả về EntityError với status 422
            return next(entityErrors);
        }

        next();
    };
};


