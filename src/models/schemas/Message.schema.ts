import { ObjectId } from 'mongodb'

interface MessageType {
  _id?: ObjectId
  conversation_id: ObjectId
  sender_id: ObjectId
  content: string
  /** Array of user ids who have read this message (sender auto-included on insert) */
  read_by?: ObjectId[]
  created_at?: Date
}

export default class Message {
  _id?: ObjectId
  conversation_id: ObjectId
  sender_id: ObjectId
  content: string
  read_by: ObjectId[]
  created_at: Date

  constructor(m: MessageType) {
    this._id = m._id
    this.conversation_id = m.conversation_id
    this.sender_id = m.sender_id
    this.content = m.content
    this.read_by = m.read_by ?? [m.sender_id]
    this.created_at = m.created_at ?? new Date()
  }
}
