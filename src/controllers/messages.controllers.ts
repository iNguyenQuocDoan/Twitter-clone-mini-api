import { Request, Response } from 'express'
import { ERROR_CODE } from '~/constants/errorCode'
import { HTTP_STATUS } from '~/constants/httpStatus'
import messagesServices from '~/services/messages.service'
import { errorResponse, paginatedResponse, successResponse } from '~/utils/response'
import { emitNewMessage } from '~/utils/realtime'

const getCurrentUserId = (req: Request) =>
  (req.decoded_authorization as { user_id?: string } | undefined)?.user_id as string

/** POST /conversations  body: { peer_id }  → get or create DM */
const createOrGetDMController = async (req: Request, res: Response) => {
  const me = getCurrentUserId(req)
  const { peer_id } = req.body as { peer_id?: string }
  if (!peer_id) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse(ERROR_CODE.SYS_002, 'peer_id là bắt buộc'))
  }
  try {
    const conv = await messagesServices.getOrCreateDM(me, peer_id)
    return res.status(HTTP_STATUS.OK).json(successResponse(conv, 'Conversation ready'))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
    return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse(ERROR_CODE.SYS_002, msg))
  }
}

/** GET /conversations?page=&limit= */
const listConversationsController = async (req: Request, res: Response) => {
  const me = getCurrentUserId(req)
  const page = Number(req.query.page) || 1
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const { items, total, total_pages } = await messagesServices.listConversations(me, page, limit)
  return res
    .status(HTTP_STATUS.OK)
    .json(paginatedResponse(items, { page, limit, total, total_pages }, 'OK'))
}

/** GET /conversations/:id/messages?page=&limit= */
const listMessagesController = async (req: Request, res: Response) => {
  const me = getCurrentUserId(req)
  const { id } = req.params
  const page = Number(req.query.page) || 1
  const limit = Math.min(Number(req.query.limit) || 30, 100)
  const result = await messagesServices.listMessages(me, id, page, limit)
  if (!result) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json(errorResponse('MSG_001', 'Conversation not found'))
  }
  if ('forbidden' in result) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse(ERROR_CODE.AUTH_005, 'Not a member'))
  }
  return res
    .status(HTTP_STATUS.OK)
    .json(paginatedResponse(result.items, { page, limit, total: result.total, total_pages: result.total_pages }, 'OK'))
}

/** POST /conversations/:id/messages  body: { content } */
const sendMessageController = async (req: Request, res: Response) => {
  const me = getCurrentUserId(req)
  const { id } = req.params
  const { content } = req.body as { content?: string }
  if (typeof content !== 'string') {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse(ERROR_CODE.SYS_002, 'content phải là string'))
  }

  const result = await messagesServices.sendMessage(me, id, content)
  if ('error' in result && result.error) {
    const map: Record<string, [number, string]> = {
      not_found: [HTTP_STATUS.NOT_FOUND, 'Conversation not found'],
      forbidden: [HTTP_STATUS.FORBIDDEN, 'Not a member'],
      empty: [HTTP_STATUS.BAD_REQUEST, 'Nội dung trống'],
      too_long: [HTTP_STATUS.BAD_REQUEST, 'Tối đa 2000 ký tự'],
    }
    const [status, message] = map[result.error]
    return res.status(status).json(errorResponse(ERROR_CODE.SYS_002, message))
  }

  // Fan-out via socket.io to all members
  emitNewMessage(result.message, result.members)

  return res.status(HTTP_STATUS.CREATED).json(successResponse(result.message, 'Sent'))
}

/** POST /conversations/:id/read */
const markReadController = async (req: Request, res: Response) => {
  const me = getCurrentUserId(req)
  const { id } = req.params
  const result = await messagesServices.markRead(me, id)
  if ('error' in result) {
    if (result.error === 'not_found') {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse('MSG_001', 'Conversation not found'))
    }
    return res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse(ERROR_CODE.AUTH_005, 'Not a member'))
  }
  return res.status(HTTP_STATUS.OK).json(successResponse(null, 'Marked as read'))
}

/** Admin: GET /admin/conversations */
const adminListAllController = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1
  const limit = Math.min(Number(req.query.limit) || 30, 100)
  const { items, total, total_pages } = await messagesServices.adminListAllConversations(page, limit)
  return res
    .status(HTTP_STATUS.OK)
    .json(paginatedResponse(items, { page, limit, total, total_pages }, 'OK'))
}

/** Admin: GET /admin/conversations/:id/messages — read any conversation */
const adminListMessagesController = async (req: Request, res: Response) => {
  const { id } = req.params
  const page = Number(req.query.page) || 1
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const result = await messagesServices.adminListMessages(id, page, limit)
  if (!result) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json(errorResponse('MSG_001', 'Conversation not found'))
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.items,
    meta: {
      page,
      limit,
      total: result.total,
      total_pages: result.total_pages,
      conversation: result.conversation,
    },
    message: 'OK',
  })
}

export {
  createOrGetDMController,
  listConversationsController,
  listMessagesController,
  sendMessageController,
  markReadController,
  adminListAllController,
  adminListMessagesController,
}
