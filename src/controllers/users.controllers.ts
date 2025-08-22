import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
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

const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {


    try {
        // truyền thằng body vào bên trong cái hàm này luôn
        await usersService.register(req.body);
        return res.json({
            message: 'register success'
        })
    } catch (error) {
        return res.json({
            message: 'register failed'
        })
    }
}



export { loginController, registerController }