import { NextFunction, Request, RequestHandler, Response } from 'express'

export const wrapRequestHandler = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // gọi trong cái promise resolve
    // Promise.resolve(func(req, res, next)).catch(next);

    // cách 2
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
