import { Router } from 'express'
import multer from 'multer'
import { readFile, unlink } from 'fs/promises'
import { verifyFile, verifyToken } from '../middleware'
import { Key, encryptToken } from '../crypt'
import config from '../config.json'

export const auth = Router()
const uploadPath = 'uploads/cache'

auth.post('/login', multer({ dest: uploadPath }).any(), verifyFile('sessionKey', uploadPath), async (req, res) => {
	const filePath = req.file['filepath']

	try {
		const data = await readFile(filePath, 'utf-8')

		if (data === Key.sessionKey) {
			res.setHeader('Authorization', await encryptToken(Date.now() + config.authKeyTimeout * 1000))
			res.setHeader('Access-Control-Expose-Headers', 'Authorization')
			res.send({ code: 200, msg: 'Auth succeed' })
		} else {
			res.status(400).send({ code: 400, msg: 'Auth error' })
		}
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Read upload file error' })
	}

	unlink(filePath).catch((err) => console.error(err))
})

auth.get('/test', verifyToken(), async (req, res) => {
	res.send({ code: 200, msg: 'Push token legitimate' })
})
