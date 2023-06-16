import { Request, Response, NextFunction } from 'express'

/** 验证File参数 */
export function logger() {
	return async (req: Request, res: Response, next: NextFunction) => {
		console.log(`[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] ${req.ip} ${req.method} ${req.originalUrl}`)
		next()
	}
}
