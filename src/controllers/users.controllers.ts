import { Request, Response } from 'express'
import User from '~/model/schemas/User.shema'
import databaseService from '~/services/database.services'

const loginController = (req: Request, res: Response) => {
    const { email, password } = req.body
    if (email === "doannguyen@gmail.com" && password === '123') {
        return res.json({
            message: "login success"
        })
    }
    return res.status(400).json({
        error: 'login failed'
    })

}

const registerController = (req: Request, res: Response) => {
    const { email, password } = req.body

    databaseService.users.insertOne(new User({
        email,
        password
    }))

    return res.status(400).json({
        error: 'register failed'
    })

}

export { loginController, registerController }