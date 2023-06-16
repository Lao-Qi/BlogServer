import { Request, Response, NextFunction } from 'express'

/** 验证Body参数 */
export function verifyBody(fiel: string, isNull: boolean = false, isArray: boolean = false) {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!isNull && !req.body[fiel]) {
			res.status(400).send({ code: 400, msg: `'${fiel}' fiel not in body` })
			return
		}

		if (isArray && !Array.isArray(req.body[fiel])) {
			res.status(400).send({ code: 400, msg: `${fiel} fiel type is not array` })
		} else if (typeof req.body[fiel] !== 'string') {
			res.status(400).send({ code: 400, msg: `${fiel} fiel type is not string` })
		}

		next()
	}
}
