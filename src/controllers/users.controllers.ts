import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequestBody } from '~/model/requests/Users.requests'
import usersService from '~/services/users.services'

const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body
    try {
        const result = await usersService.login({ email, password });
        return res.json(result);
    } catch (error) {
        return res.status(400).json({
            error: 'login failed'
        });
    }
}

const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response, next: NextFunction) => {
    // cái này thì khi nào bị lỗi thì nhảy ra thay vì dùng try-catch
    // throw new Error('Registration failed');
    // Nhận kết quả từ service (bao gồm cả token)
    const result = await usersService.register(req.body);


    // In ra console để debug
    console.log('Access Token:', result.access_token)
    console.log('Refresh Token:', result.refresh_token)

    // throw new Error('Registration failed');
    // truyền thằng body vào bên trong cái hàm này luôn
    await usersService.register(req.body);
    return res.json({
        message: 'register success',
        data: result
    })

}



export { loginController, registerController }