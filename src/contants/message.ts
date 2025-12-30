export const USER_MESSAGES = {
  VALIDATION_ERROR: 'Validation error occurred',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_LENGTH_INVALID: 'Name must be between 1 and 100 characters',
  NAME_MUST_BE_STRING: 'Name must be a string',
  EMAIL_ALREADY_IN_USE: 'Email already in use',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_STRING: 'Password must be a string',
  PASSWORD_LENGTH_INVALID: 'Password must be between 6 and 50 characters',
  PASSWORD_NOT_STRONG_ENOUGH: 'Password is not strong enough',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_INVALID: 'Confirm password must be between 6 and 50 characters',
  CONFIRM_PASSWORD_NOT_STRONG_ENOUGH: 'Confirm password is not strong enough',
  PASSWORD_CONFIRMATION_DOES_NOT_MATCH: 'Password confirmation does not match password',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be a valid ISO 8601 date'
} as const
