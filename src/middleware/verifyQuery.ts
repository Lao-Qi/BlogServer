import { Request, Response, NextFunction } from 'express'

/** 验证Query参数 */
export function verifyQuery(fiel: string, isNull: boolean = false, isArray: boolean = false) {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!isNull && !req.query[fiel]) {
			res.status(400).send({ code: 400, msg: `'${fiel}' fiel not in query` })
			return
		}

		if (isArray && !Array.isArray(req.query[fiel])) {
			res.status(400).send({ code: 400, msg: `${fiel} fiel type is not array` })
		} else if (typeof req.query[fiel] !== 'string') {
			res.status(400).send({ code: 400, msg: `${fiel} fiel type is not string` })
		}

		next()
	}
}
