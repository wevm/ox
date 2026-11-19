import { encodeBase58 } from 'ethers'
import { Bytes, Hex } from 'ox'
import { bench, describe } from 'vitest'
import { fromBytes, fromHex, toBytes } from '../Base58.js'

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

describe('Base58.fromBytes', () => {
  const bytes32 = Bytes.fromHex(`0x00${'7f3a'.repeat(15)}c1`)
  const bytes256 = Bytes.fromHex(`0x${'9e51'.repeat(128)}`)

  bench('ox: 32 bytes', () => {
    fromBytes(bytes32)
  })

  bench('ox: 256 bytes', () => {
    fromBytes(bytes256)
  })
})

describe('Base58.toBytes', () => {
  const string32 = fromBytes(Bytes.fromHex(`0x00${'7f3a'.repeat(15)}c1`))
  const string256 = fromBytes(Bytes.fromHex(`0x${'9e51'.repeat(128)}`))

  bench('ox: 32 bytes', () => {
    toBytes(string32)
  })

  bench('ox: 256 bytes', () => {
    toBytes(string256)
  })
})
