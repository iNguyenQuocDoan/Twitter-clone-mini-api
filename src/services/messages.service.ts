import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Conversation from '~/models/schemas/Conversation.schema'
import Message from '~/models/schemas/Message.schema'

/**
 * Sort 2 ids ascending so DM members[] always has stable order — lets us
 * upsert by exact members match for 1-on-1 DM.
 */
function sortMembers(a: ObjectId, b: ObjectId): ObjectId[] {
  return a.toHexString() < b.toHexString() ? [a, b] : [b, a]
}

class MessagesServices {
  /** Find or create a 1-on-1 conversation between two users. */
  async getOrCreateDM(user_a: string, user_b: string) {
    if (user_a === user_b) throw new Error('Không thể tạo DM với chính mình')
    const members = sortMembers(new ObjectId(user_a), new ObjectId(user_b))

    const existing = await databaseService.conversations.findOne({
      members: { $all: members, $size: 2 },
    })
    if (existing) return existing

    const doc = new Conversation({ members })
    const result = await databaseService.conversations.insertOne(doc)
    return databaseService.conversations.findOne({ _id: result.insertedId })
  }

  /**
   * List conversations of a user, sorted by most recent activity.
   * Includes the "other" user as `peer` (lookup users; pick the non-self
   * member). last_message + last_message_at already on the conversation doc.
   */
  async listConversations(user_id: string, page: number, limit: number) {
    const me = new ObjectId(user_id)
    const filter = { members: me }

    const pipeline: any[] = [
      { $match: filter },
      { $sort: { last_message_at: -1, updated_at: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      // attach peer
      {
        $lookup: {
          from: 'users',
          let: { mems: '$members' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$mems'] } } },
            { $project: { _id: 1, name: 1, username: 1, avatar: 1 } },
          ],
          as: '__users',
        },
      },
      // unread count: messages in this conv not yet read by me
      {
        $lookup: {
          from: 'messages',
          let: { cid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$conversation_id', '$$cid'] },
                    { $not: [{ $in: [me, '$read_by'] }] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: '__unread',
        },
      },
      {
        $addFields: {
          peer: {
            $first: {
              $filter: {
                input: '$__users',
                as: 'u',
                cond: { $ne: ['$$u._id', me] },
              },
            },
          },
          unread_count: { $ifNull: [{ $arrayElemAt: ['$__unread.count', 0] }, 0] },
        },
      },
      { $project: { __users: 0, __unread: 0 } },
    ]

    const [items, total] = await Promise.all([
      databaseService.conversations.aggregate(pipeline).toArray(),
      databaseService.conversations.countDocuments(filter),
    ])
    return { items, total, page, limit, total_pages: Math.ceil(total / limit) }
  }

  async listMessages(user_id: string, conversation_id: string, page: number, limit: number) {
    const cid = new ObjectId(conversation_id)

    // Auth check — must be a member
    const conv = await databaseService.conversations.findOne({ _id: cid })
    if (!conv) return null
    const me = new ObjectId(user_id)
    if (!conv.members.some((m) => m.equals(me))) return { forbidden: true as const }

    const [items, total] = await Promise.all([
      databaseService.messages
        .find({ conversation_id: cid })
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      databaseService.messages.countDocuments({ conversation_id: cid }),
    ])
    // Return ASCENDING so FE just renders top-down within a page
    return {
      items: items.reverse(),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      conversation: conv,
    }
  }

  async sendMessage(user_id: string, conversation_id: string, content: string) {
    const cid = new ObjectId(conversation_id)
    const me = new ObjectId(user_id)
    const conv = await databaseService.conversations.findOne({ _id: cid })
    if (!conv) return { error: 'not_found' as const }
    if (!conv.members.some((m) => m.equals(me))) return { error: 'forbidden' as const }

    const trimmed = content.trim()
    if (!trimmed) return { error: 'empty' as const }
    if (trimmed.length > 2000) return { error: 'too_long' as const }

    const msgDoc = new Message({ conversation_id: cid, sender_id: me, content: trimmed })
    const result = await databaseService.messages.insertOne(msgDoc)

    await databaseService.conversations.updateOne(
      { _id: cid },
      {
        $set: {
          last_message: trimmed,
          last_sender_id: me,
          last_message_at: msgDoc.created_at,
          updated_at: msgDoc.created_at,
        },
      },
    )

    return {
      message: { ...msgDoc, _id: result.insertedId },
      members: conv.members,
    }
  }

  /** Mark all messages of a conv as read for the given user. */
  async markRead(user_id: string, conversation_id: string) {
    const me = new ObjectId(user_id)
    const cid = new ObjectId(conversation_id)
    const conv = await databaseService.conversations.findOne({ _id: cid })
    if (!conv) return { error: 'not_found' as const }
    if (!conv.members.some((m) => m.equals(me))) return { error: 'forbidden' as const }

    await databaseService.messages.updateMany(
      { conversation_id: cid, read_by: { $ne: me } },
      { $addToSet: { read_by: me } },
    )
    return { ok: true as const }
  }

  /** Admin-only: list all conversations across users with member details. */
  async adminListAllConversations(page: number, limit: number) {
    const pipeline: any[] = [
      { $sort: { last_message_at: -1, updated_at: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          let: { mems: '$members' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$mems'] } } },
            { $project: { _id: 1, name: 1, username: 1, avatar: 1 } },
          ],
          as: 'member_users',
        },
      },
      // also pull message count
      {
        $lookup: {
          from: 'messages',
          let: { cid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$conversation_id', '$$cid'] } } },
            { $count: 'count' },
          ],
          as: '__count',
        },
      },
      {
        $addFields: {
          message_count: { $ifNull: [{ $arrayElemAt: ['$__count.count', 0] }, 0] },
        },
      },
      { $project: { __count: 0 } },
    ]
    const [items, total] = await Promise.all([
      databaseService.conversations.aggregate(pipeline).toArray(),
      databaseService.conversations.countDocuments({}),
    ])
    return { items, total, page, limit, total_pages: Math.ceil(total / limit) }
  }
}

const messagesServices = new MessagesServices()
export default messagesServices
