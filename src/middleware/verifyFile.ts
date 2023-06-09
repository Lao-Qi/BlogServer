import { Request, Response, NextFunction } from 'express'
import { join } from 'path'
import { unlink } from 'fs/promises'

/** 验证File参数 */
export function verifyFile(fiel: string, uploadPath: string) {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.files) {
			res.status(400).send({ code: 400, msg: 'Not found essay file in body' })
			return
		}

		req.file = req.files[0]
		const filePath = join(process.cwd(), uploadPath, req.file.filename)

		if (req.file.fieldname !== fiel) {
			res.status(400).send({ code: 400, msg: `File fielname is not '${fiel}'` })

			unlink(filePath).catch((err) => console.error(err))
			return
		}

		req.file['filepath'] = filePath
		next()
	}
}
