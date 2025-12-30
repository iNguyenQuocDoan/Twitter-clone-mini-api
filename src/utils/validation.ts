import { error } from 'console'
import express from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { EntityError, ErrorsWithStatus } from '~/models/Errors'

// can be reused by many routes
const validate = (validations: ValidationChain[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)))
    // không có lỗi thì next
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    const errorsObject = errors.mapped()
    const entityErrors = new EntityError({ errors: {} })
    for (const key in errorsObject) {
      // trả về lỗi không phải của validate
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorsWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityErrors.errors[key] = errorsObject[key]
    }

    next(entityErrors)
  }
}

export { validate }
