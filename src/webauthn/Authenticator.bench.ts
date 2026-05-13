import { bench, describe } from 'vitest'
import * as P256 from '../core/P256.js'
import * as Authenticator from './Authenticator.js'

const { publicKey } = P256.createKeyPair()
const credentialId = new Uint8Array(32)
for (let i = 0; i < 32; i++) credentialId[i] = i

describe('Authenticator.getAuthenticatorData (no credential)', () => {
  bench('hex output', () => {
    Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      signCount: 420,
    })
  })

  bench('bytes output', () => {
    Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      signCount: 420,
      as: 'Bytes',
    })
  })
})

describe('Authenticator.getAuthenticatorData (with credential)', () => {
  bench('hex output', () => {
    Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: { id: credentialId, publicKey },
    })
  })

  bench('bytes output', () => {
    Authenticator.getAuthenticatorData({
      rpId: 'example.com',
      flag: 0x41,
      credential: { id: credentialId, publicKey },
      as: 'Bytes',
    })
  })
})

const authenticatorDataHex = Authenticator.getAuthenticatorData({
  rpId: 'example.com',
  signCount: 420,
})
const authenticatorDataBytes = Authenticator.getAuthenticatorData({
  rpId: 'example.com',
  signCount: 420,
  as: 'Bytes',
})

describe('Authenticator.getSignCount', () => {
  bench('from hex', () => {
    Authenticator.getSignCount(authenticatorDataHex)
  })

  bench('from bytes', () => {
    Authenticator.getSignCount(authenticatorDataBytes)
  })
})
