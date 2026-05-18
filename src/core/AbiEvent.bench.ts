import { bench, describe } from 'vitest'
import * as AbiEvent from './AbiEvent.js'

const transfer = AbiEvent.from(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
)

const args = {
  from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  to: '0x9876543210987654321098765432109876543210' as `0x${string}`,
}

const encoded = AbiEvent.encode(transfer, args)
const log = {
  topics: encoded.topics as readonly `0x${string}`[],
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000' as `0x${string}`,
}

describe('AbiEvent.encode', () => {
  bench('Transfer', () => {
    AbiEvent.encode(transfer, args)
  })
})

describe('AbiEvent.decode', () => {
  bench('Transfer', () => {
    AbiEvent.decode(transfer, log)
  })
})
