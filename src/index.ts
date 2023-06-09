import 'reflect-metadata'
import express = require('express')
import cors = require('cors')
import compression = require('compression')
import { database } from './database'
import { generateRSAKey } from './crypt'
import config from './config.json'
import { logger } from './middleware'
import { join } from 'path'

async function bootstarp() {
	if (!database.isInitialized) {
		await database.initialize()
	}

	await generateRSAKey()
	const { router } = await import('./api/router')

	const port = config.port || 8080
	const app = express()

	app.use(logger())
	app.use(express.json())
	app.use(express.urlencoded({ extended: false }))
	app.use(cors())
	app.use(compression())
	app.use(express.static(join(__dirname, '../public')))
	app.use(router)

	app.listen(port, () => {
		console.log(`http://127.0.0.1:${port}`)
	})
}

bootstarp()
