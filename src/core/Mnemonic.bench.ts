import { bench, describe } from 'vitest'
import * as Mnemonic from './Mnemonic.js'

const mnemonic = Mnemonic.random(Mnemonic.english)

describe('Mnemonic.toSeed', () => {
  bench('toSeed (sync, PBKDF2-HMAC-SHA512 x 2048)', () => {
    Mnemonic.toSeed(mnemonic)
  })
})

describe('Mnemonic.toPrivateKey', () => {
  bench('toPrivateKey (default path)', () => {
    Mnemonic.toPrivateKey(mnemonic)
  })
})
