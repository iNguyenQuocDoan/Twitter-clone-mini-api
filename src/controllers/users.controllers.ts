import { Request, Response } from 'express'

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

export default loginController