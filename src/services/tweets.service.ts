import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enums'
import { CreateTweetRequestBody } from '~/models/requests/Tweet.requests'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from './database.services'

/**
 * Pipeline stages enriching a tweet document with:
 *   - user        (basic public info from users collection)
 *   - like_count, bookmark_count, comment_count, retweet_count, quote_count
 *   - is_liked, is_bookmarked  (only computed when current_user_id is provided)
 *
 * Designed to be reused across getTimeline, getTweet, getUserTweets, getBookmarks.
 */
const enrichmentStages = (current_user_id?: string) => {
  const currentUserObjectId = current_user_id ? new ObjectId(current_user_id) : null

  return [
    // join author
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: '__author',
        pipeline: [{ $project: { _id: 1, name: 1, username: 1, avatar: 1 } }],
      },
    },
    { $addFields: { user: { $arrayElemAt: ['$__author', 0] } } },
    { $project: { __author: 0 } },

    // counts via $lookup with count pipelines
    {
      $lookup: {
        from: 'likes',
        let: { tid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$tweet_id', '$$tid'] } } },
          { $count: 'count' },
        ],
        as: '__likes',
      },
    },
    {
      $lookup: {
        from: 'bookmarks',
        let: { tid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$tweet_id', '$$tid'] } } },
          { $count: 'count' },
        ],
        as: '__bookmarks',
      },
    },
    {
      $lookup: {
        from: 'tweets',
        let: { tid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$parent_id', '$$tid'] },
              type: TweetType.Comment,
            },
          },
          { $count: 'count' },
        ],
        as: '__comments',
      },
    },
    {
      $lookup: {
        from: 'tweets',
        let: { tid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$parent_id', '$$tid'] },
              type: { $in: [TweetType.Retweet, TweetType.QuoteTweet] },
            },
          },
          { $count: 'count' },
        ],
        as: '__retweets',
      },
    },
    {
      $addFields: {
        like_count: { $ifNull: [{ $arrayElemAt: ['$__likes.count', 0] }, 0] },
        bookmark_count: { $ifNull: [{ $arrayElemAt: ['$__bookmarks.count', 0] }, 0] },
        comment_count: { $ifNull: [{ $arrayElemAt: ['$__comments.count', 0] }, 0] },
        retweet_count: { $ifNull: [{ $arrayElemAt: ['$__retweets.count', 0] }, 0] },
      },
    },
    { $project: { __likes: 0, __bookmarks: 0, __comments: 0, __retweets: 0 } },

    // current-user-specific flags
    ...(currentUserObjectId
      ? [
          {
            $lookup: {
              from: 'likes',
              let: { tid: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tweet_id', '$$tid'] },
                        { $eq: ['$user_id', currentUserObjectId] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: '__userLike',
            },
          },
          {
            $lookup: {
              from: 'bookmarks',
              let: { tid: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tweet_id', '$$tid'] },
                        { $eq: ['$user_id', currentUserObjectId] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: '__userBookmark',
            },
          },
          {
            $addFields: {
              is_liked: { $gt: [{ $size: '$__userLike' }, 0] },
              is_bookmarked: { $gt: [{ $size: '$__userBookmark' }, 0] },
            },
          },
          { $project: { __userLike: 0, __userBookmark: 0 } },
        ]
      : [
          { $addFields: { is_liked: false, is_bookmarked: false } },
        ]),
  ]
}

class TweetServices {
  async createTweet(user_id: string, body: CreateTweetRequestBody) {
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        ...body,
        user_id: new ObjectId(user_id),
        parent_id: body.parent_id ? new ObjectId(body.parent_id) : null,
        mentions: body.mentions ? body.mentions.map((id) => new ObjectId(id)) : [],
      }),
    )
    const [enriched] = await databaseService.tweets
      .aggregate([{ $match: { _id: result.insertedId } }, ...enrichmentStages(user_id)])
      .toArray()
    return enriched
  }

  async getTweet(tweet_id: string, current_user_id?: string) {
    const _id = new ObjectId(tweet_id)
    const [enriched] = await databaseService.tweets
      .aggregate([{ $match: { _id } }, ...enrichmentStages(current_user_id)])
      .toArray()
    if (!enriched) return null

    // increment view counter (separate from aggregation read)
    const viewField = current_user_id ? 'user_views' : 'guest_views'
    await databaseService.tweets.updateOne(
      { _id },
      { $inc: { [viewField]: 1 }, $set: { updated_at: new Date() } },
    )
    enriched[viewField] = (enriched[viewField] || 0) + 1
    return enriched
  }

  async getUserTweets(username: string, page: number, limit: number, current_user_id?: string) {
    const user = await databaseService.user.findOne(
      { username },
      { projection: { _id: 1 } },
    )
    if (!user) return null

    const match = { user_id: user._id, type: TweetType.Tweet }

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          { $match: match },
          { $sort: { created_at: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          ...enrichmentStages(current_user_id),
        ])
        .toArray(),
      databaseService.tweets.countDocuments(match),
    ])

    return { tweets, total, page, limit, total_pages: Math.ceil(total / limit) }
  }

  async getTimeline(user_id: string, page: number, limit: number) {
    const followed = await databaseService.followers
      .find({ user_id: new ObjectId(user_id) }, { projection: { followed_user_id: 1 } })
      .toArray()

    const followed_user_ids = followed.map((f) => f.followed_user_id)
    followed_user_ids.push(new ObjectId(user_id))

    const match = {
      user_id: { $in: followed_user_ids },
      type: TweetType.Tweet,
    }

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          { $match: match },
          { $sort: { created_at: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          ...enrichmentStages(user_id),
        ])
        .toArray(),
      databaseService.tweets.countDocuments(match),
    ])

    if (tweets.length > 0) {
      await databaseService.tweets.updateMany(
        { _id: { $in: tweets.map((t) => t._id as ObjectId) } },
        { $inc: { user_views: 1 }, $set: { updated_at: new Date() } },
      )
    }

    return { tweets, total, page, limit, total_pages: Math.ceil(total / limit) }
  }
}

const tweetServices = new TweetServices()
export default tweetServices
export { enrichmentStages }
