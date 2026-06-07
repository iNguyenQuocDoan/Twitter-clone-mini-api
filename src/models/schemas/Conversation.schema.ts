import { ObjectId } from 'mongodb'

interface ConversationType {
  _id?: ObjectId
  /** Sorted ascending. For 1-on-1 DM: always 2 elements. */
  members: ObjectId[]
  last_message?: string
  last_sender_id?: ObjectId | null
  last_message_at?: Date | null
  created_at?: Date
  updated_at?: Date
}

export default class Conversation {
  _id?: ObjectId
  members: ObjectId[]
  last_message: string
  last_sender_id: ObjectId | null
  last_message_at: Date | null
  created_at: Date
  updated_at: Date

  constructor(c: ConversationType) {
    const now = new Date()
    this._id = c._id
    this.members = c.members
    this.last_message = c.last_message ?? ''
    this.last_sender_id = c.last_sender_id ?? null
    this.last_message_at = c.last_message_at ?? null
    this.created_at = c.created_at ?? now
    this.updated_at = c.updated_at ?? now
  }
}
