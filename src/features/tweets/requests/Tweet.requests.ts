import { TweetAudience, TweetType } from '~/constants/enums'

interface CreateTweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id?: string | null
  hashtags?: string[]
  mentions?: string[]
  medias?: { url: string; type: 'image' | 'video' }[]
}

export { CreateTweetRequestBody }
