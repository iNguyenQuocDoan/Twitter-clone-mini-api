import { config } from 'dotenv'
import { ObjectId } from 'mongodb'

import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Follower from '~/models/schemas/Follower.schema'
import Like from '~/models/schemas/Like.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import Conversation from '~/models/schemas/Conversation.schema'
import Message from '~/models/schemas/Message.schema'
import { hashPassword } from '~/utils/crypto'
import { TweetAudience, TweetType, UserRole, UserVerifyStatus } from '~/constants/enums'

config()

const SEED_PASSWORD = 'Password@123'

interface SeedUserInput {
  name: string
  username: string
  email: string
  bio: string
  location: string
  role?: UserRole
}

const seedUsers: SeedUserInput[] = [
  {
    name: 'Admin',
    username: 'admin',
    email: 'admin@example.com',
    bio: 'Administrator account. Có toàn quyền hệ thống (chưa wire endpoint admin-only).',
    location: 'Internal',
    role: UserRole.Admin,
  },
  {
    name: 'An Nguyen',
    username: 'an_dev',
    email: 'an@example.com',
    bio: 'Frontend engineer. Đang xây Twitter clone bằng Next.js 16.',
    location: 'Hà Nội',
  },
  {
    name: 'Binh Tran',
    username: 'binh_designer',
    email: 'binh@example.com',
    bio: 'Product designer. Mê dark mode và typography.',
    location: 'Đà Nẵng',
  },
  {
    name: 'Chi Le',
    username: 'chi_backend',
    email: 'chi@example.com',
    bio: 'Backend engineer @ Express + MongoDB.',
    location: 'TP. Hồ Chí Minh',
  },
]

async function run() {
  console.log('[seed] Connecting to MongoDB...')
  await databaseService.connect()

  console.log('[seed] Clearing existing seed data (matching seed emails)...')
  const seedEmails = seedUsers.map((u) => u.email)
  const existingUsers = await databaseService.user.find({ email: { $in: seedEmails } }).toArray()
  const existingIds = existingUsers.map((u) => u._id)

  if (existingIds.length > 0) {
    const tweetCursor = await databaseService.tweets.find({ user_id: { $in: existingIds } }).toArray()
    const tweetIds = tweetCursor.map((t) => t._id)

    // Find conversations that involve any seeded user, then remove their messages too
    const seededConvs = await databaseService.conversations
      .find({ members: { $in: existingIds } })
      .toArray()
    const seededConvIds = seededConvs.map((c) => c._id!)
    if (seededConvIds.length > 0) {
      await databaseService.messages.deleteMany({ conversation_id: { $in: seededConvIds } })
      await databaseService.conversations.deleteMany({ _id: { $in: seededConvIds } })
    }

    await databaseService.likes.deleteMany({
      $or: [{ user_id: { $in: existingIds } }, { tweet_id: { $in: tweetIds } }],
    })
    await databaseService.bookmarks.deleteMany({
      $or: [{ user_id: { $in: existingIds } }, { tweet_id: { $in: tweetIds } }],
    })
    await databaseService.tweets.deleteMany({ user_id: { $in: existingIds } })
    await databaseService.followers.deleteMany({
      $or: [{ user_id: { $in: existingIds } }, { followed_user_id: { $in: existingIds } }],
    })
    await databaseService.refreshTokens.deleteMany({ user_id: { $in: existingIds } })
    await databaseService.user.deleteMany({ _id: { $in: existingIds } })
    console.log(
      `[seed] Cleared ${existingIds.length} seed users + ${seededConvIds.length} conversations`,
    )
  }

  console.log('[seed] Inserting users...')
  const userDocs = seedUsers.map(
    (u) =>
      new User({
        _id: new ObjectId(),
        name: u.name,
        email: u.email,
        username: u.username,
        password: hashPassword(SEED_PASSWORD),
        date_of_birth: new Date('1998-01-01'),
        bio: u.bio,
        location: u.location,
        verify: UserVerifyStatus.Verified,
        role: u.role ?? UserRole.User,
      }),
  )
  await databaseService.user.insertMany(userDocs)
  const [admin, an, binh, chi] = userDocs
  console.log(`[seed] Inserted ${userDocs.length} users (1 admin + 3 regular)`)

  console.log('[seed] Inserting follows (an follows binh + chi; binh follows an)...')
  await databaseService.followers.insertMany([
    new Follower({ user_id: an._id!, followed_user_id: binh._id! }),
    new Follower({ user_id: an._id!, followed_user_id: chi._id! }),
    new Follower({ user_id: binh._id!, followed_user_id: an._id! }),
  ])

  console.log('[seed] Inserting tweets...')
  const now = Date.now()
  const minute = 60 * 1000
  const tweetSpecs: Array<{ author: User; content: string; hashtags?: string[]; ageMin: number }> = [
    { author: an, content: 'Vừa fix xong bug font serif do biến CSS self-reference. Đời nhẹ hẳn 😌', hashtags: ['nextjs', 'css'], ageMin: 2 },
    { author: an, content: 'Dark mode Linear-style cuối cùng cũng lên. Border alpha 8% là vừa đủ subtle.', hashtags: ['design'], ageMin: 18 },
    { author: an, content: 'TanStack Query v5 useInfiniteQuery API gọn hơn v4 nhiều.', hashtags: ['react'], ageMin: 90 },
    { author: binh, content: 'Typography compact + spacing dày là công thức của một feed dễ đọc.', hashtags: ['typography'], ageMin: 5 },
    { author: binh, content: 'Đang phân vân giữa rounded-xl và rounded-2xl cho card. Chọn cái nào nhỉ?', ageMin: 40 },
    { author: binh, content: 'Empty state không nên chỉ là một dòng text xám. Cho icon vào ngay đi.', hashtags: ['ux'], ageMin: 120 },
    { author: chi, content: 'Vừa thêm endpoint /users/refresh-token. FE giờ silent refresh được rồi.', hashtags: ['express', 'jwt'], ageMin: 8 },
    { author: chi, content: 'CORS trên Express + cookie cross-site nhớ set credentials và origin cụ thể.', hashtags: ['express'], ageMin: 30 },
    { author: chi, content: 'MongoDB local cho dev nhanh hơn Atlas khoảng 10 lần. Atlas chỉ để demo deploy.', hashtags: ['mongodb'], ageMin: 240 },
  ]
  const tweetDocs = tweetSpecs.map(
    (spec) =>
      new Tweet({
        _id: new ObjectId(),
        user_id: spec.author._id!,
        type: TweetType.Tweet,
        audience: TweetAudience.Everyone,
        content: spec.content,
        hashtags: spec.hashtags || [],
        mentions: [],
        medias: [],
        created_at: new Date(now - spec.ageMin * minute),
        updated_at: new Date(now - spec.ageMin * minute),
      }),
  )
  await databaseService.tweets.insertMany(tweetDocs)
  console.log(`[seed] Inserted ${tweetDocs.length} tweets`)

  console.log('[seed] Inserting likes + bookmarks...')
  // an likes one binh tweet + one chi tweet
  const binhFirstTweet = tweetDocs.find((t) => t.user_id.equals(binh._id!))
  const chiFirstTweet = tweetDocs.find((t) => t.user_id.equals(chi._id!))
  if (binhFirstTweet && chiFirstTweet) {
    await databaseService.likes.insertMany([
      new Like({ user_id: an._id!, tweet_id: binhFirstTweet._id! }),
      new Like({ user_id: an._id!, tweet_id: chiFirstTweet._id! }),
    ])
    await databaseService.bookmarks.insertOne(
      new Bookmark({ user_id: an._id!, tweet_id: chiFirstTweet._id! }),
    )
  }

  console.log('[seed] Inserting conversations + messages...')
  // Member arrays MUST be sorted ascending by hex string — same rule as
  // messages.service.ts:sortMembers. Without that, `getOrCreateDM` would
  // create duplicate conversations on next use.
  const sortIds = (a: ObjectId, b: ObjectId): [ObjectId, ObjectId] =>
    a.toHexString() < b.toHexString() ? [a, b] : [b, a]

  const day = 24 * 60 * minute

  /**
   * Each message lists who has read it. By default the sender already has,
   * peer may or may not. `unread: true` on a peer message means it stays
   * unread for the recipient (so unread badges show variety).
   */
  interface SeededMsg {
    sender: ObjectId
    content: string
    /** Minutes ago. Older = larger number. */
    ageMin: number
    /** If true, peer has NOT read this message. Defaults to false (peer read). */
    unread?: boolean
  }
  interface SeededConv {
    members: [ObjectId, ObjectId]
    messages: SeededMsg[]
  }

  const conversationSpecs: SeededConv[] = [
    // ── 1. an ↔ binh — long thread, 2 recent unread for an
    {
      members: sortIds(an._id!, binh._id!),
      messages: [
        { sender: an._id!, content: 'Bin ơi, tối nay rảnh không? Đi cà phê nhé', ageMin: 3 * day + 90 },
        { sender: binh._id!, content: 'Rảnh đó! Quán cũ chỗ Pasteur nhé?', ageMin: 3 * day + 88 },
        { sender: an._id!, content: 'Ok 7h tối luôn', ageMin: 3 * day + 87 },
        { sender: binh._id!, content: 'Deal 👍', ageMin: 3 * day + 86 },
        { sender: binh._id!, content: 'Sáng nay nghe nói team mình có ngân sách cho design system. Hype quá', ageMin: day + 200 },
        { sender: an._id!, content: 'Thật á? Khi nào tao có thể tham gia early?', ageMin: day + 180 },
        { sender: binh._id!, content: 'Để hỏi sếp xong báo lại', ageMin: day + 170 },
        { sender: an._id!, content: 'Vừa làm xong cái dark mode kiểu Linear, hôm nay show bạn xem', ageMin: 12 },
        { sender: binh._id!, content: 'Hay đó! Border alpha bao nhiêu thế?', ageMin: 10, unread: true },
        { sender: an._id!, content: '8%, tinted cool xíu. Nhìn vừa đủ.', ageMin: 8 },
        { sender: binh._id!, content: 'Send code cho t với, t copy cho project lab', ageMin: 4, unread: true },
      ],
    },

    // ── 2. an ↔ chi — work thread, 1 unread for an
    {
      members: sortIds(an._id!, chi._id!),
      messages: [
        { sender: chi._id!, content: 'An, /tweets/timeline đang trả về data field mới rồi nhé, FE update lại schema chưa?', ageMin: 2 * day + 60 },
        { sender: an._id!, content: 'Có rồi, infinite query đã đổi sang lastPage.meta.page', ageMin: 2 * day + 58 },
        { sender: chi._id!, content: 'Ok. Mai mình thêm endpoint comments nữa', ageMin: 2 * day + 55 },
        { sender: an._id!, content: 'Gửi cho mình API contract trước khi vào FE nha', ageMin: 2 * day + 50 },
        { sender: chi._id!, content: 'Sẽ paste trong Notion. Reply route là POST /tweets/:id/replies', ageMin: 2 * day + 45 },
        { sender: an._id!, content: 'Btw conv detail của admin chạy chưa?', ageMin: 6 * 60 },
        { sender: chi._id!, content: 'Chạy rồi, /admin/conversations/:id/messages bypass member check', ageMin: 5 * 60 + 50 },
        { sender: chi._id!, content: 'Test xong nhớ note lại trong README', ageMin: 30, unread: true },
      ],
    },

    // ── 3. binh ↔ chi — short, fully read
    {
      members: sortIds(binh._id!, chi._id!),
      messages: [
        { sender: binh._id!, content: 'Chi ơi mai design review nhớ join nhé', ageMin: 5 * day },
        { sender: chi._id!, content: 'Mấy giờ vậy?', ageMin: 5 * day - 2 },
        { sender: binh._id!, content: '10h sáng, 30 phút thôi', ageMin: 5 * day - 5 },
        { sender: chi._id!, content: 'Ok 👌', ageMin: 5 * day - 10 },
      ],
    },

    // ── 4. admin ↔ an — system notice, admin has unread
    {
      members: sortIds(admin._id!, an._id!),
      messages: [
        { sender: admin._id!, content: 'Hi An, thấy bạn build FE tốt. Có rảnh giúp QA admin panel không?', ageMin: 8 * 60 },
        { sender: an._id!, content: 'Có rảnh ạ! Em test thử rồi feedback sau', ageMin: 7 * 60 + 45 },
        { sender: admin._id!, content: 'Cảm ơn. Note vào Linear ticket ADMIN-12 nhé', ageMin: 7 * 60 + 30 },
        { sender: an._id!, content: 'Đã note. Em đang gặp bug "Xem như user" reload mất banner, sẽ ping lại', ageMin: 45, unread: true },
      ],
    },

    // ── 5. admin ↔ binh — quick ping, fully read
    {
      members: sortIds(admin._id!, binh._id!),
      messages: [
        { sender: admin._id!, content: 'Binh, design hệ thống profile mới có spec chưa?', ageMin: day + 120 },
        { sender: binh._id!, content: 'Có rồi, link Figma đã share trong Slack #design', ageMin: day + 110 },
        { sender: admin._id!, content: 'Got it, thanks 👍', ageMin: day + 100 },
      ],
    },
  ]

  let totalMessages = 0
  let totalUnread = 0
  for (const spec of conversationSpecs) {
    const convId = new ObjectId()
    const sortedMsgs = [...spec.messages].sort((a, b) => b.ageMin - a.ageMin) // oldest first
    const last = sortedMsgs[sortedMsgs.length - 1]
    const peerOf = (sender: ObjectId) =>
      spec.members.find((m) => !m.equals(sender)) as ObjectId

    const conv = new Conversation({
      _id: convId,
      members: spec.members,
      last_message: last.content,
      last_sender_id: last.sender,
      last_message_at: new Date(now - last.ageMin * minute),
      created_at: new Date(now - sortedMsgs[0].ageMin * minute),
      updated_at: new Date(now - last.ageMin * minute),
    })
    await databaseService.conversations.insertOne(conv)

    const messageDocs = sortedMsgs.map((m) => {
      const peer = peerOf(m.sender)
      const readBy = [m.sender]
      // If not explicitly unread, peer has also read it
      if (!m.unread) readBy.push(peer)
      else totalUnread += 1
      return new Message({
        _id: new ObjectId(),
        conversation_id: convId,
        sender_id: m.sender,
        content: m.content,
        read_by: readBy,
        created_at: new Date(now - m.ageMin * minute),
      })
    })
    await databaseService.messages.insertMany(messageDocs)
    totalMessages += messageDocs.length
  }

  console.log('')
  console.log('=== SEED DONE ===')
  console.log('')
  console.log('Login credentials (password: Password@123)')
  seedUsers.forEach((u) => {
    const tag = u.role === UserRole.Admin ? '  [ADMIN]' : ''
    console.log(`  - ${u.email}  (@${u.username})${tag}`)
  })
  console.log('')
  console.log(`Users:         ${userDocs.length}`)
  console.log(`Tweets:        ${tweetDocs.length}`)
  console.log(`Follows:       3`)
  console.log(`Likes:         2`)
  console.log(`Bookmarks:     1`)
  console.log(`Conversations: ${conversationSpecs.length}`)
  console.log(`Messages:      ${totalMessages}  (${totalUnread} unread for peers)`)
}

run()
  .catch((err) => {
    console.error('[seed] FAILED:', err)
    process.exit(1)
  })
  .finally(() => {
    setTimeout(() => process.exit(0), 500)
  })
