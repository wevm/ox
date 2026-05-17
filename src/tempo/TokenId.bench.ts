import { bench, describe } from 'vitest'
import * as TokenId from './TokenId.js'

const sender = '0x1234567890123456789012345678901234567890' as const
const salt =
  '0x0000000000000000000000000000000000000000000000000000000000000001' as const

const tokenIdAddress = '0x20c0000000000000000000000000000000000001' as const
const tokenIdBigInt = 1n
const tokenIdLargeBigInt = 0xdeadbeefcafebabe1234n

describe('TokenId.compute', () => {
  bench('hex sender', () => {
    TokenId.compute({ sender, salt })
  })
})

describe('TokenId.fromAddress', () => {
  bench('hex address', () => {
    TokenId.fromAddress(tokenIdAddress)
  })
})

describe('TokenId.toAddress', () => {
  bench('small bigint', () => {
    TokenId.toAddress(tokenIdBigInt)
  })

  bench('large bigint', () => {
    TokenId.toAddress(tokenIdLargeBigInt)
  })

  bench('hex address passthrough', () => {
    TokenId.toAddress(tokenIdAddress)
  })
})
