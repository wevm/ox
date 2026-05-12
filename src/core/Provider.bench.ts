import { bench, describe } from 'vitest'
import * as Provider from './Provider.js'

describe('Provider.createEmitter', () => {
  bench('createEmitter()', () => {
    Provider.createEmitter()
  })
})

describe('Provider.parseError', () => {
  const knownCodes = [
    4001, 4100, 4200, 4900, 4901, 4902, 5700, 5701, 5710, 5711, 5720, 5750,
  ]
  const errors = knownCodes.map((code) => ({
    code: -32603,
    message: 'Internal',
    data: { code, message: 'inner' },
  }))

  bench('parseError(provider code rotating)', () => {
    for (const error of errors) Provider.parseError(error)
  })

  bench('parseError(rpc code)', () => {
    Provider.parseError({ code: -32000, message: 'oops' })
  })

  bench('parseError(plain Error)', () => {
    Provider.parseError(new Error('boom'))
  })
})
