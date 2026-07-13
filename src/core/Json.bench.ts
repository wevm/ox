import { bench, describe } from 'vp/test'
import * as Json from './Json.js'

const small = { foo: 'bar', n: 42, ok: true }

const medium = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    blockNumber: '0x1a4',
    transactions: Array.from({ length: 32 }, (_, i) => ({
      hash: `0xfeed${i}`,
      from: `0xabc${i}`,
      to: `0xdef${i}`,
      value: '0x0',
      nonce: i,
    })),
  },
}

const withBigInt = {
  ...small,
  big: 12345678901234567890n,
  arr: [1n, 2n, 3n, 4n, 5n],
}

const smallStr = JSON.stringify(small)
const mediumStr = JSON.stringify(medium)
const withBigIntStr = Json.stringify(withBigInt)

describe('Json.parse (no bigint sentinel)', () => {
  bench('small object', () => {
    Json.parse(smallStr)
  })
  bench('medium object (32 txs)', () => {
    Json.parse(mediumStr)
  })
})

describe('Json.parse (with bigint sentinel)', () => {
  bench('small object with bigint', () => {
    Json.parse(withBigIntStr)
  })
})

describe('Json.stringify', () => {
  bench('small object', () => {
    Json.stringify(small)
  })
  bench('medium object (32 txs)', () => {
    Json.stringify(medium)
  })
  bench('object with bigint', () => {
    Json.stringify(withBigInt)
  })
})

describe('Json.canonicalize', () => {
  bench('small object', () => {
    Json.canonicalize(small)
  })
  bench('medium object (32 txs)', () => {
    Json.canonicalize(medium)
  })
})
