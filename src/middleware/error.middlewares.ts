import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { ERROR_CODE } from '~/constants/errorCode'
import { EntityError, ErrorsWithStatus } from '~/models/Errors'
import { errorResponse } from '~/utils/response'

export const defaultErrorsHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof EntityError) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
      errorResponse(err.code, err.message, err.errors)
    )
  }

  if (err instanceof ErrorsWithStatus) {
    return res.status(err.status).json(
      errorResponse(err.code, err.message)
    )
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    errorResponse(ERROR_CODE.SYS_001, err.message || 'Internal server error')
  )
}
