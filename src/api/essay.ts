import { Router } from 'express'
import multer from 'multer'
import { readFile, unlink } from 'fs/promises'
import { Like } from 'typeorm'
import { join } from 'path'
import { database } from '../database'
import { Essay } from '../entitys'
import { verifyToken, verifyQuery, verifyFile } from '../middleware'

export const essay = Router()

const uploadPath = 'uploads/essays/'
const essayRepository = database.getRepository(Essay)

essay.get('/', verifyQuery('id'), async (req, res) => {
	try {
		const essays = await essayRepository.findOneBy({ id: parseInt(req.query.id as string) })
		res.send({ code: 200, msg: 'Search succeed', data: essays ?? {} })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

essay.get('/search', verifyQuery('key'), verifyQuery('num', true), async (req, res) => {
	try {
		const essays = await essayRepository.find({
			where: [
				{
					name: Like(`%${req.query.key}%`)
				},
				{
					decs: Like(`%${req.query.key}%`)
				},
				{
					tags: Like(`%${req.query.key}%`)
				}
			],
			order: {
				name: 'ASC'
			},
			take: parseInt(req.query.num as string) || 1
		})

		res.send({ code: 200, msg: 'Search succeed', data: req.query.single === '1' ? essays[0] ?? {} : essays })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

essay.get('/all', verifyToken(), async (_, res) => {
	essayRepository
		.find()
		.then((essays) => {
			res.send({ code: 200, msg: 'Search succeed', data: essays })
		})
		.catch((err) => {
			console.error(err)
			res.status(500).send({ code: 200, msg: 'Search error' })
		})
})

essay.post('/upload', verifyToken(), multer({ dest: uploadPath }).any(), verifyFile('essay', uploadPath), async (req, res) => {
	const essay = new Essay()
	essay.name = req.body.name ?? req.file.originalname
	essay.originalname = req.file.originalname
	essay.size = req.file.size
	essay.decs = req.body.decs
	essay.filename = req.file.filename
	essay.mimetype = req.file.mimetype
	essay.setTags(req.body.tags ? String(req.body.tags).split('--') : [])

	if (!req.body.decs) {
		try {
			essay.decs = (await readFile(req.file['filepath'], 'utf-8')).slice(0, 200)
		} catch (err) {
			console.error(err)
			essay.decs = ''
		}
	}

	try {
		const nessay = await essayRepository.save(essay)
		res.send({ code: 200, msg: 'Upload succeed', data: { id: nessay.id, time: nessay.uploadTime, name: nessay.name } })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'upload essay on server error' })
	}
})

essay.post('/updateFiel', verifyQuery('id'), verifyToken(), async (req, res) => {
	if (!req.body.name && !req.body.decs && !req.body.tags) {
		res.status(400).send({ code: 400, msg: 'Update data fiel is null' })
		return
	}

	try {
		const essay = await essayRepository.findOneBy({ id: parseInt(req.query.id as string) })
		req.body.name && (essay.name = req.body.name)
		req.body.decs && (essay.decs = req.body.decs)
		req.body.tags && essay.setTags(req.body.tags)
		essay.updateTime = Date.now()
		const nessay = await essayRepository.save(essay)
		res.send({ code: 200, msg: 'Update succeed', data: nessay })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Update error' })
	}
})

essay.post('/updateFile', verifyQuery('id'), verifyToken(), multer({ dest: uploadPath }).any(), verifyFile('essay', uploadPath), async (req, res) => {
	try {
		const essay = await essayRepository.findOneBy({ id: parseInt(req.query.id as string) })
		await unlink(join(process.cwd(), uploadPath, essay.filename))
		essay.originalname = req.file.originalname
		essay.filename = req.file.filename
		essay.size = req.file.size
		essay.mimetype = req.file.mimetype
		essay.updateTime = Date.now()
		const nessay = await essayRepository.save(essay)

		res.send({ code: 200, msg: 'Update succeed', data: nessay })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Update error' })
	}
})

essay.delete('/remove', verifyQuery('id'), verifyToken(), async (req, res) => {
	try {
		const essay = await essayRepository.findOneBy({ id: parseInt(req.query.id as string) })
		const result = await essayRepository.delete({ id: parseInt(req.query.id as string) })
		await unlink(join(process.cwd(), uploadPath, essay.filename))

		res.send({ code: 200, msg: 'Delete succeed', data: { id: req.query.id, ...result } })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: `Delete ${req.query.id} data error` })
	}
})
