import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Resource {
	@PrimaryGeneratedColumn({ type: 'int' })
	id: number

	@Column({ type: 'text' })
	name: string

	@Column({ type: 'text' })
	decs: string

	@Column({ type: 'text' })
	filename: string

	@Column({ type: 'text' })
	originalname: string

	@Column({ type: 'text', default: '' })
	tags: string

	@Column({ type: 'int', default: 0 })
	downloads: number

	@Column({ type: 'text' })
	mimetype: string

	@Column({ type: 'int', nullable: true })
	size: number | undefined

	@Column({ type: 'int', default: () => Date.now() })
	uploadTime: number

	@Column({ type: 'int', default: () => Date.now() })
	updateTime: number

	setTags(tags: string[]) {
		this.tags = [...tags].join('--')
	}
}
