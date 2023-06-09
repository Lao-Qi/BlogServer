import { DataSource } from 'typeorm'
import { join } from 'path'
import { Essay, Resource } from './entitys'

export const database = new DataSource({
	type: 'better-sqlite3',
	database: join(process.cwd(), './database.db'),
	timeout: 5000,
	logging: ['error', 'warn'],
	entities: [Resource, Essay],
	synchronize: true
})
