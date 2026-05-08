import express from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { HTTP_STATUS } from '../constants/httpStatus'
import { EntityError, ErrorsWithStatus } from '../models/Errors'

const validate = (validations: ValidationChain[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)))
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    const errorsObject = errors.mapped()
    const entityErrors = new EntityError({ errors: {} })
    for (const key in errorsObject) {
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
