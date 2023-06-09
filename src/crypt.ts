import { writeFile } from 'fs/promises'
import { generateKeyPairSync, publicEncrypt, privateDecrypt, randomBytes } from 'crypto'
import config from './config.json'
import { join } from 'path'

/** 存储密钥 */
export class Key {
	static publicKey: string
	static privateKey: string
	static sessionKey: string
}

/** 生成RSA密钥 */
export async function generateRSAKey() {
	const { publicKey, privateKey } = generateKeyPairSync('rsa', {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem'
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem'
		}
	})

	Key.publicKey = publicKey
	Key.privateKey = privateKey
	Key.sessionKey = publicEncrypt(publicKey, Buffer.from(`${config.sessionKey}-${randomBytes(50)}`)).toString('base64')

	await writeFile(join(process.cwd(), 'sessionKey.key'), Key.sessionKey)

	console.log(`服务器会话密钥 sessionKey.key 已生成! `)
}

/** token加密 */
export async function encryptToken(time: number) {
	return publicEncrypt(Key.publicKey, Buffer.from(`${time}`)).toString('base64url')
}

/** token解密 */
export async function decryptToken(value: string) {
	return parseInt(privateDecrypt(Key.privateKey, Buffer.from(value, 'base64url')).toString())
}
