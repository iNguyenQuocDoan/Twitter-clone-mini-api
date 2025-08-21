import { Request, Response } from 'express'
import User from '~/model/schemas/User.shema'
import databaseService from '~/services/database.services'
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

const registerController = async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
        await usersService.register({ email, password });
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