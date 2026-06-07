/**
 * Lazy socket.io accessor. The server is set up in src/socket/io.ts and stored
 * here so service/controller code can emit without circular import on index.ts.
 */
import { ObjectId } from 'mongodb'
import type { Server as SocketServer } from 'socket.io'

let _io: SocketServer | null = null

export function setIO(io: SocketServer) {
  _io = io
}

export function getIO(): SocketServer | null {
  return _io
}

interface NewMessage {
  _id: ObjectId
  conversation_id: ObjectId
  sender_id: ObjectId
  content: string
  created_at: Date
  read_by: ObjectId[]
}

/**
 * Emit to every member's personal room + the conversation room + the admin
 * feed room. Personal rooms let users get a notification badge from anywhere
 * in the app; conversation room is for users currently sitting in that chat;
 * admin:feed broadcasts to all logged-in admins watching the dashboard.
 */
export function emitNewMessage(message: NewMessage, members: ObjectId[]) {
  const io = _io
  if (!io) return

  const payload = {
    _id: message._id.toHexString(),
    conversation_id: message.conversation_id.toHexString(),
    sender_id: message.sender_id.toHexString(),
    content: message.content,
    created_at: message.created_at.toISOString(),
    read_by: message.read_by.map((id) => id.toHexString()),
  }

  io.to(`conv:${payload.conversation_id}`).emit('message:new', payload)
  members.forEach((m) => {
    io.to(`user:${m.toHexString()}`).emit('conversation:bump', payload)
  })
  io.to('admin:feed').emit('admin:message', payload)
}
