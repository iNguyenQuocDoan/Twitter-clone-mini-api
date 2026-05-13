enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

enum UserRole {
  User,
  Admin
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

export { UserVerifyStatus, UserRole, TokenType, TweetType, TweetAudience }
