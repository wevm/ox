import { bench, describe } from 'vp/test'
import * as HdKey from './HdKey.js'
import * as Hex from './Hex.js'

const seedBytes = Uint8Array.from({ length: 64 }, (_, index) => index)
const seedHex = Hex.fromBytes(seedBytes)
const root = HdKey.fromSeed(seedBytes)

describe('HdKey.fromSeed', () => {
  bench('Bytes.Bytes input (64 bytes)', () => {
    HdKey.fromSeed(seedBytes)
  })

  bench('Hex.Hex input (64 bytes)', () => {
    HdKey.fromSeed(seedHex)
  })
})

describe('HdKey.fromExtendedKey', () => {
  bench('private extended key', () => {
    HdKey.fromExtendedKey(root.privateExtendedKey)
  })
})

describe('HdKey.derive', () => {
  bench("m/0'", () => {
    root.derive("m/0'")
  })

  bench("m/44'/60'/0'/0/0", () => {
    root.derive("m/44'/60'/0'/0/0")
  })
})
