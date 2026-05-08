export const ERROR_CODE = {
  // Auth
  AUTH_001: 'AUTH_001', // Invalid credentials
  AUTH_002: 'AUTH_002', // Access token expired
  AUTH_003: 'AUTH_003', // Access token invalid
  AUTH_004: 'AUTH_004', // Refresh token expired/revoked
  AUTH_005: 'AUTH_005', // Insufficient permissions
  AUTH_006: 'AUTH_006', // Email already registered

  // User
  USER_001: 'USER_001', // User not found
  USER_002: 'USER_002', // Old password incorrect
  USER_003: 'USER_003', // Email already verified
  USER_004: 'USER_004', // User is banned

  // Tweet
  TWEET_001: 'TWEET_001', // Tweet not found
  TWEET_002: 'TWEET_002', // Tweet id invalid
  TWEET_003: 'TWEET_003', // Parent tweet not found

  // System
  SYS_001: 'SYS_001', // Internal server error
  SYS_002: 'SYS_002', // Validation failed
  SYS_003: 'SYS_003'  // Rate limit exceeded
} as const
