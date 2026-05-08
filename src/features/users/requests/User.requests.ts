interface RegisterRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

interface UpdateMeRequestBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

interface ChangePasswordRequestBody {
  old_password: string
  password: string
  confirm_password: string
}

export { RegisterRequestBody, UpdateMeRequestBody, ChangePasswordRequestBody }
