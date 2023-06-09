import { Router } from 'express'
import { auth as Auth } from './auth'
import { essay as Essay } from './essay'
import { resource as Resource } from './resource'

export const router = Router()
router.use('/auth', Auth)
router.use('/essay', Essay)
router.use('/resource', Resource)
