import type { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { ObjectId } from 'mongodb'
import { verifyToken } from '~/utils/jwt'
import { setIO } from '~/utils/realtime'
import databaseService from '~/services/database.services'
import { UserRole } from '~/constants/enums'

export function setupSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: 'http://localhost:3000', credentials: true },
  })

  // JWT auth on handshake. Reject if no/invalid token.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined
      if (!token) return next(new Error('No token'))
      const decoded = (await verifyToken({ token })) as { user_id: string }
      socket.data.user_id = decoded.user_id

      // Look up role for admin:feed gating
      const user = await databaseService.user.findOne(
        { _id: new ObjectId(decoded.user_id) },
        { projection: { role: 1 } },
      )
      socket.data.role = user?.role ?? UserRole.User
      return next()
    } catch (err) {
      return next(err instanceof Error ? err : new Error('Auth failed'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.user_id as string
    const role = socket.data.role as number

    // Personal room: receives conversation:bump (for any DM the user is in)
    socket.join(`user:${userId}`)

    // Admin opt-in feed
    if (role === UserRole.Admin) {
      socket.join('admin:feed')
    }

    // Join/leave a specific conversation room
    socket.on('conv:join', (conversationId: string) => {
      if (typeof conversationId === 'string') socket.join(`conv:${conversationId}`)
    })
    socket.on('conv:leave', (conversationId: string) => {
      if (typeof conversationId === 'string') socket.leave(`conv:${conversationId}`)
    })

    socket.on('disconnect', () => {
      // socket.io auto-removes from rooms on disconnect
    })
  })

  setIO(io)
  return io
}
