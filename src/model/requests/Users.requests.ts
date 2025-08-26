// định nghĩa những cái body mà user sẽ gửi lên

export interface RegisterRequestBody {
    email: string;
    password: string;
    confirm_password: string;
    date_of_birth: Date;
}

export interface LoginRequestBody {
    email: string
    password: string
}