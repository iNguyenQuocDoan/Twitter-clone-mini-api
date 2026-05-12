import { config } from 'dotenv'
import { ObjectId } from 'mongodb'

import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Follower from '~/models/schemas/Follower.schema'
import Like from '~/models/schemas/Like.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import { hashPassword } from '~/utils/crypto'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'

config()

const SEED_PASSWORD = 'Password@123'

interface SeedUserInput {
  name: string
  username: string
  email: string
  bio: string
  location: string
}

const seedUsers: SeedUserInput[] = [
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
    console.log(`[seed] Cleared ${existingIds.length} existing seed users + their data`)
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
      }),
  )
  await databaseService.user.insertMany(userDocs)
  const [an, binh, chi] = userDocs
  console.log(`[seed] Inserted ${userDocs.length} users`)

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

  console.log('')
  console.log('=== SEED DONE ===')
  console.log('')
  console.log('Login credentials (password: Password@123)')
  seedUsers.forEach((u) => {
    console.log(`  - ${u.email}  (@${u.username})`)
  })
  console.log('')
  console.log(`Users:     ${userDocs.length}`)
  console.log(`Tweets:    ${tweetDocs.length}`)
  console.log(`Follows:   3`)
  console.log(`Likes:     2`)
  console.log(`Bookmarks: 1`)
}

run()
  .catch((err) => {
    console.error('[seed] FAILED:', err)
    process.exit(1)
  })
  .finally(() => {
    setTimeout(() => process.exit(0), 500)
  })
