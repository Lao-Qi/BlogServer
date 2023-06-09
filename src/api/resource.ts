import { Router } from 'express'
import multer from 'multer'
import { unlink } from 'fs/promises'
import { Like } from 'typeorm'
import { join } from 'path'
import { database } from '../database'
import { Resource } from '../entitys'
import { verifyToken, verifyQuery, verifyFile } from '../middleware'

export const resource = Router()

const uploadPath = 'uploads/resource/'
const resourceRepository = database.getRepository(Resource)

resource.get('/', verifyQuery('id'), async (req, res) => {
	try {
		const resources = await resourceRepository.findOneBy({ id: parseInt(req.query.id as string) })
		res.send({ code: 200, msg: 'Search succeed', data: resources ?? {} })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

resource.get('/search', verifyQuery('key'), async (req, res) => {
	try {
		const resources = await resourceRepository.find({
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

		res.send({ code: 200, msg: 'Search succeed', data: req.query.single === '1' ? resources[0] ?? {} : resources })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Search error' })
	}
})

resource.get('/all', verifyToken(), async (_, res) => {
	try {
		const resources = await resourceRepository.find()
		res.send({ code: 200, msg: 'Search succeed', data: resources })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

resource.get('/download', verifyQuery('id'), async (req, res) => {
	try {
		const resource = await resourceRepository.findOneBy({ filename: req.query.id as string })
		resource.downloads += 1
		await resourceRepository.save(resource)
		res.download(join(process.cwd(), uploadPath, resource.filename))
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Download error' })
	}
})

resource.post('/upload', verifyToken(), multer({ dest: uploadPath }).any(), verifyFile('resource', uploadPath), async (req, res) => {
	const resource = new Resource()
	resource.name = req.body.name ?? req.file.originalname
	resource.originalname = req.file.originalname
	resource.setTags(req.body.tags ?? [])
	resource.decs = req.body.decs ?? ''
	resource.size = req.file.size
	resource.filename = req.file.filename
	resource.mimetype = req.file.mimetype

	try {
		const nresource = await resourceRepository.save(resource)
		res.send({ code: 200, msg: 'Upload succeed', data: { id: nresource.id, time: nresource.uploadTime, name: nresource.name } })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'upload essay on server error' })
	}
})

resource.post('/updateFiel', verifyQuery('id'), verifyToken(), async (req, res) => {
	if (!req.body.name && !req.body.decs && !req.body.tags) {
		res.status(400).send({ code: 400, msg: 'Update data fiel is null' })
		return
	}

	try {
		const resource = await resourceRepository.findOneBy({ id: parseInt(req.query.id as string) })
		req.body.name && (resource.name = req.body.name)
		req.body.decs && (resource.decs = req.body.decs)
		req.body.tags && resource.setTags(req.body.tags)
		resource.updateTime = Date.now()
		const nresource = await resourceRepository.save(resource)
		res.send({ code: 200, msg: 'Update succeed', data: nresource })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Update error' })
	}
})

resource.post('/updateFile', verifyQuery('id'), verifyToken(), multer({ dest: uploadPath }).any(), verifyFile('resource', uploadPath), async (req, res) => {
	try {
		const resource = await resourceRepository.findOneBy({ id: parseInt(req.query.id as string) })
		await unlink(join(process.cwd(), uploadPath, resource.filename))
		resource.filename = req.file.filename
		resource.size = req.file.size
		resource.mimetype = req.file.mimetype
		resource.updateTime = Date.now()
		await resourceRepository.save(resource)

		res.send({ code: 200, msg: 'Update succeed' })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Update error' })
	}
})

resource.delete('/remove', verifyQuery('id'), verifyToken(), async (req, res) => {
	try {
		const resource = await resourceRepository.findOneBy({ id: parseInt(req.query.id as string) })
		const result = await resourceRepository.delete({ id: parseInt(req.query.id as string) })
		await unlink(join(process.cwd(), uploadPath, resource.filename))

		res.send({ code: 200, msg: 'Delete succeed', data: { id: req.query.id, ...result } })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: `Delete ${req.query.id} data error` })
	}
})
