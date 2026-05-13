import { Request, Response } from 'express'
import { ERROR_CODE } from '~/constants/errorCode'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/message'
import { UserRole, UserVerifyStatus } from '~/constants/enums'
import adminServices from '~/services/admin.service'
import { errorResponse, paginatedResponse, successResponse } from '~/utils/response'

const ALLOWED_ROLES = new Set<number>([UserRole.User, UserRole.Admin])
const ALLOWED_VERIFY = new Set<number>([
  UserVerifyStatus.Unverified,
  UserVerifyStatus.Verified,
  UserVerifyStatus.Banned,
])

const getStatsController = async (_req: Request, res: Response) => {
  const stats = await adminServices.getStats()
  return res.status(HTTP_STATUS.OK).json(successResponse(stats, 'Get stats successfully'))
}

const listUsersController = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const search = typeof req.query.search === 'string' ? req.query.search : undefined

  const { users, total, total_pages } = await adminServices.listUsers({ page, limit, search })
  return res
    .status(HTTP_STATUS.OK)
    .json(paginatedResponse(users, { page, limit, total, total_pages }, 'List users successfully'))
}

const updateUserController = async (req: Request, res: Response) => {
  const { id } = req.params
  const adminId = (req.decoded_authorization as { user_id?: string })?.user_id

  if (id === adminId) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse('ADMIN_001', 'Admin không thể chỉnh sửa chính mình'))
  }

  const { role, verify } = req.body as { role?: number; verify?: number }

  if (role !== undefined && !ALLOWED_ROLES.has(role)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse(ERROR_CODE.SYS_002, 'role không hợp lệ'))
  }
  if (verify !== undefined && !ALLOWED_VERIFY.has(verify)) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse(ERROR_CODE.SYS_002, 'verify không hợp lệ'))
  }
  if (role === undefined && verify === undefined) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse(ERROR_CODE.SYS_002, 'Cần ít nhất một field: role hoặc verify'))
  }

  const updated = await adminServices.updateUser(id, { role, verify })
  if (!updated) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json(errorResponse(ERROR_CODE.USER_001, USER_MESSAGES.USER_NOT_FOUND))
  }
  return res.status(HTTP_STATUS.OK).json(successResponse(updated, 'Update user successfully'))
}

export { getStatsController, listUsersController, updateUserController }
