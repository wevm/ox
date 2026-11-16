import { bench, describe } from 'vp/test'
import * as Abi from './Abi.js'
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

const erc20Abi = Abi.from([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

// 31 other events ahead of `Transfer`, as in a large protocol ABI.
const abi32 = Abi.from([
  ...Array.from(
    { length: 31 },
    (_, i) => `event Event${i}(address indexed account, uint256 value)`,
  ),
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

const logs = Array.from({ length: 500 }, (_, i) => {
  const { topics } = AbiEvent.encode(transfer, {
    from: `0x${(i + 1).toString(16).padStart(40, '0')}`,
    to: `0x${(i + 2).toString(16).padStart(40, '0')}`,
  })
  return {
    data: `0x${i.toString(16).padStart(64, '0')}` as `0x${string}`,
    topics: topics as readonly `0x${string}`[],
  }
})

describe('AbiEvent.decodeLog', () => {
  bench('500 Transfer logs (erc20Abi)', () => {
    for (const log of logs) AbiEvent.decodeLog(erc20Abi, log)
  })

  bench('500 Transfer logs (32-event ABI)', () => {
    for (const log of logs) AbiEvent.decodeLog(abi32, log)
  })
})
