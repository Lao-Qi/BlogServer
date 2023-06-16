import { Router } from 'express'
import multer from 'multer'
import multiparty from 'multiparty'
import { randomUUID } from 'crypto'
import { unlink } from 'fs/promises'
import { createReadStream, createWriteStream, readFileSync } from 'fs'
import { Like } from 'typeorm'
import { join } from 'path'
import { database } from '../database'
import { Resource } from '../entitys'
import { verifyToken, verifyQuery, verifyFile, verifyBody } from '../middleware'

export const resource = Router()

const uploadPath = 'uploads/resource/'
const uploadCatch = 'uploads/cache/'
const catcheMap: { [key: string]: any[] } = {}
const resourceRepository = database.getRepository(Resource)

resource.get('/', verifyQuery('id'), async (req, res) => {
	try {
		const resource = await resourceRepository.findOneBy({ id: parseInt(req.query.id as string) })
		res.send({ code: 200, msg: 'Search succeed', data: resource ? transformedResource(resource) : {} })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

resource.get('/getAll', async (_, res) => {
	try {
		const resources = await resourceRepository.find()
		res.send({ code: 200, msg: 'Search succeed', data: resources.map((resource) => transformedResource(resource)) })
	} catch (err) {
		res.status(500).send({ code: 200, msg: 'Search error' })
	}
})

resource.get('/download', verifyQuery('id'), async (req, res) => {
	try {
		const resource = await resourceRepository.findOneBy({ id: Number(req.query.id) })
		const filePath = join(process.cwd(), uploadPath, resource.filename)

		if (!resource) {
			res.status(404).send({ code: 404, msg: 'Not found resource' })
			return
		}

		resource.downloads += 1
		await resourceRepository.save(resource)

		res.setHeader('Content-Length', resource.size).setHeader('Content-Type', resource.mimetype).status(200)
		createReadStream(filePath).pipe(res)
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'Download error' })
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
			data = resources[0] ? transformedResource(resources[0]) : {}
		} else {
			data = resources.map((essay) => transformedResource(essay))
		}

		res.send({ code: 200, msg: 'Search succeed', data })
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

resource.post('/upload', verifyToken(), async (req, res) => {
	try {
		const pushForm = new multiparty.Form({
			uploadDir: uploadCatch
		})

		pushForm.parse(req, (err, fields, files) => {
			if (err) {
				console.log(err)
				res.status(500).send({ code: 500, msg: 'Upload error' })
				return
			}

			console.log(fields)
			console.log(files)

			if (!fields['id'] || !fields['index']) {
				res.status(400).send({ code: 400, msg: "Upload data 'id' or 'index' not found in body" })
				return
			}

			const file = files.chunk[0]
			const id = fields.id[0]
			const index = fields.index[0]
			catcheMap[id] ??= []
			catcheMap[id].push({ ...file, index })

			res.send({ code: 200, msg: 'Upload succeed' })
		})
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'upload essay on server error' })
	}
})

resource.post('/merge', verifyBody('id'), verifyBody('name'), verifyToken(), async (req, res) => {
	try {
		if (!catcheMap[req.body.id]) {
			res.status(400).send({ code: 400, msg: 'Not found upload file' })
			return
		}

		const filename = randomUUID()
		const fileWrite = createWriteStream(join(process.cwd(), uploadPath, filename))
		const chunks = catcheMap[req.body.id]
		chunks.sort((a, b) => a.index - b.index)

		/** 合并文件 */
		for (const [_, chunkFile] of Object.entries(chunks)) {
			console.log(chunkFile)

			const chunk = readFileSync(chunkFile.path)
			fileWrite.write(chunk)
			await unlink(chunkFile.path)
		}

		delete catcheMap[req.body.id]

		fileWrite.close()

		/** 加入数据库 */
		const resource = new Resource()
		resource.mimetype = req.body.mimeType
		resource.name = req.body.name
		resource.tags = req.body.tags
		resource.filename = filename
		resource.size = parseInt(req.body.size)
		resource.ext = req.body.ext
		console.log(resource)

		await resourceRepository.save(resource)

		res.send({ code: 200, msg: 'Upload succeed' })
	} catch (err) {
		console.error(err)
		res.status(500).send({ code: 500, msg: 'upload essay on server error' })
	}
})

resource.post('/updateFiel', verifyQuery('id'), verifyToken(), async (req, res) => {
	if (!req.body.name && !req.body.tags) {
		res.status(400).send({ code: 400, msg: 'Update data fiel is null' })
		return
	}

	try {
		const resource = await resourceRepository.findOneBy({ id: parseInt(req.query.id as string) })
		req.body.name && (resource.name = req.body.name)
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

function transformedResource(resource: Resource) {
	return {
		id: resource.id,
		name: resource.name,
		uploadTime: resource.uploadTime,
		mimeType: resource.mimetype,
		size: resource.size,
		tags: resource.tags,
		ext: resource.ext
	}
}
