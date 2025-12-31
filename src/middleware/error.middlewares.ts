import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { ErrorsWithStatus } from '~/models/Errors'

export const defaultErrorsHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorsWithStatus) {
    return res.status(err.status).json(omit(err, 'status'))
  }

  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: err.errorInfo
  })
}
