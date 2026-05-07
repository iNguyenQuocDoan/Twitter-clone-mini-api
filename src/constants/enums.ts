enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

enum TweetAudience {
  Everyone,
  TwitterCircle
}

export { UserVerifyStatus, TokenType, TweetType, TweetAudience }
