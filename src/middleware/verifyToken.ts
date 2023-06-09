import { Request, Response, NextFunction } from 'express'
import { decryptToken } from '../crypt'

/** 验证token */
export function verifyToken() {
	return async (req: Request, res: Response, next: NextFunction) => {
		const token = req.headers['authorization']
		if (!token) {
			res.status(401).send({ code: 401, msg: 'Not found auth token in header' })
			return
		}

		try {
			const time = await decryptToken(token)
			if (Date.now() >= time) {
				res.status(401).send({ code: 401, msg: 'Auth token timeout' })
				return
			}

			next()
		} catch (err) {
			res.status(401).send({ code: 401, msg: 'Token illegal' })
		}
	}
}
