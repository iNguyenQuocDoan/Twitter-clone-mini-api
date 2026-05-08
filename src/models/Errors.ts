import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/message'
import { ERROR_CODE } from '~/constants/errorCode'

type ErrorsType = Record<string, { msg: string; [key: string]: any }>

class ErrorsWithStatus {
  message: string
  status: number
  code: string

  constructor({ message, status, code = ERROR_CODE.SYS_001 }: { message: string; status: number; code?: string }) {
    this.message = message
    this.status = status
    this.code = code
  }
}

class EntityError extends ErrorsWithStatus {
  errors: ErrorsType

  constructor({ message = USER_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: ERROR_CODE.SYS_002 })
    this.errors = errors
  }
}

export { EntityError, ErrorsWithStatus }
