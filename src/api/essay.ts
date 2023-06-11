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
		const essay = await essayRepository.findOneBy({ id: parseInt(req.query.id as string) })
		res.send({ code: 200, msg: 'Search succeed', data: essay ? transformedEssay(essay) : {} })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

essay.get('/getAll', async (_, res) => {
	try {
		const essays = await essayRepository.find()
		res.send({ code: 200, msg: 'Search succeed', data: essays.map((essay) => transformedEssay(essay)) })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

essay.get('/read', verifyQuery('name'), async (req, res) => {
	try {
		const essay = await essayRepository.findOneBy({ name: req.query.name as string })
		const file = await readFile(join(process.cwd(), uploadPath, essay.filename), 'utf-8')
		res.status(200).send({ code: 200, data: { info: transformedEssay(essay), file } })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Server opertion on error' })
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

		let data = {}
		if (req.query.single) {
			data = essays[0] ? transformedEssay(essays[0]) : {}
		} else {
			data = essays.map((essay) => transformedEssay(essay))
		}

		res.send({ code: 200, msg: 'Search succeed', data })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

essay.get('/all', verifyToken(), async (_, res) => {
	essayRepository
		.find()
		.then((essays) => {
			res.send({
				code: 200,
				msg: 'Search succeed',
				data: essays.map((essay) => transformedEssay(essay))
			})
		})
		.catch((err) => {
			console.error(err)
			res.status(500).send({ code: 200, msg: 'Search error' })
		})
})

essay.post('/upload', verifyToken(), multer({ dest: uploadPath }).any(), verifyFile('essay', uploadPath), async (req, res) => {
	const essay = new Essay()
	essay.name = req.body.name ?? Buffer.from(req.file.originalname).toString('utf-8')
	essay.originalname = Buffer.from(req.file.originalname).toString('utf-8')
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

function transformedEssay(essay: Essay) {
	return {
		id: essay.id,
		decs: essay.decs,
		name: essay.name,
		tags: essay.tags,
		uploadTime: essay.uploadTime,
		updateTime: essay.updateTime,
		mimeType: essay.mimetype,
		size: essay.size
	}
}
