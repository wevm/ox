import { encodeBase58 } from 'ethers'
import { bench, describe } from 'vitest'
import { from } from '../Hex/from.js'
import { Base58_fromBytes } from './fromBytes.js'
import { Base58_fromHex } from './fromHex.js'

const bytes = new Uint8Array([
  72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
])
const hex = from(bytes)

describe('base58 encode (bytes)', () => {
  bench('ethers', () => {
    encodeBase58(bytes)
  })

  bench('ox', () => {
    Base58_fromBytes(bytes)
  })
})

describe('base58 encode (hex)', () => {
  bench('ethers', () => {
    encodeBase58(hex)
  })

  bench('ox', () => {
    Base58_fromHex(hex)
  })
})
