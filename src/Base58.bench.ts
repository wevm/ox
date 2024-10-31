import { encodeBase58 } from 'ethers'
import { Hex } from 'ox'
import { bench, describe } from 'vitest'
import { fromBytes, fromHex } from './Base58.js'

const bytes = new Uint8Array([
  72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
])
const hex = Hex.from(bytes)

describe('base58 encode (bytes)', () => {
  bench('ethers', () => {
    encodeBase58(bytes)
  })

  bench('ox', () => {
    fromBytes(bytes)
  })
})

describe('base58 encode (hex)', () => {
  bench('ethers', () => {
    encodeBase58(hex)
  })

  bench('ox', () => {
    fromHex(hex)
  })
})
