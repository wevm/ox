import { bench, describe } from 'vitest'
import * as Cbor from './Cbor.js'

const small = { ok: true, n: 42, msg: 'hello' }
const medium = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    blockNumber: '0x1a4',
    transactions: Array.from({ length: 16 }, (_, i) => `0xfeed${i}`),
    logs: Array.from({ length: 8 }, (_, i) => ({
      address: `0xabc${i}`,
      topics: ['0xdead', '0xbeef'],
      data: '0xcafe',
    })),
  },
}
const bytesPayload = new Uint8Array(256).map((_, i) => i & 0xff)

const encodedSmall = Cbor.encode(small)
const encodedMedium = Cbor.encode(medium)
const encodedBytes = Cbor.encode(bytesPayload)

const encodedSmallBytes = Cbor.encode(small, { as: 'Bytes' })
const encodedMediumBytes = Cbor.encode(medium, { as: 'Bytes' })

describe('Cbor.encode', () => {
  bench('small object', () => {
    Cbor.encode(small)
  })
  bench('medium object', () => {
    Cbor.encode(medium)
  })
  bench('256-byte buffer', () => {
    Cbor.encode(bytesPayload)
  })
  bench('small object (as: Bytes)', () => {
    Cbor.encode(small, { as: 'Bytes' })
  })
})

describe('Cbor.decode', () => {
  bench('small object (Hex)', () => {
    Cbor.decode(encodedSmall)
  })
  bench('medium object (Hex)', () => {
    Cbor.decode(encodedMedium)
  })
  bench('256-byte buffer (Hex)', () => {
    Cbor.decode(encodedBytes)
  })
  bench('small object (Bytes)', () => {
    Cbor.decode(encodedSmallBytes)
  })
  bench('medium object (Bytes)', () => {
    Cbor.decode(encodedMediumBytes)
  })
})
