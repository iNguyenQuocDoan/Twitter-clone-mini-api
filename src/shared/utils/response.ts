interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

const successResponse = <T>(data: T, message: string) => ({
  success: true,
  data,
  message
})

const paginatedResponse = <T>(data: T[], meta: PaginationMeta, message: string) => ({
  success: true,
  data,
  meta,
  message
})

const errorResponse = (code: string, message: string, details: Record<string, any> = {}) => ({
  success: false,
  error: { code, message, details }
})

export { successResponse, paginatedResponse, errorResponse, PaginationMeta }
