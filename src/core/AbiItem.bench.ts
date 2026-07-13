import { bench, describe } from 'vp/test'
import * as Abi from './Abi.js'
import * as AbiItem from './AbiItem.js'

// Build a 200-item ABI (mix of function + event signatures) so each
// `fromAbi` selector lookup walks a realistically large list.
const signatures: string[] = []
for (let i = 0; i < 180; i++) {
  signatures.push(`function fn${i}(uint256 a, address b) returns (bool)`)
}
for (let i = 0; i < 20; i++) {
  signatures.push(
    `event Evt${i}(address indexed a, uint256 b, bytes32 indexed c)`,
  )
}
const abi200 = Abi.from(signatures)

// Use the last function so a naive linear scan is forced to walk to
// the end before matching.
const lastFn = AbiItem.fromAbi(abi200, 'fn179')
const lastSelector = AbiItem.getSelector(lastFn)

const firstFn = AbiItem.fromAbi(abi200, 'fn0')
const firstSelector = AbiItem.getSelector(firstFn)

describe('AbiItem.fromAbi (selector)', () => {
  bench('200-item ABI: last function', () => {
    AbiItem.fromAbi(abi200, lastSelector)
  })

  bench('200-item ABI: first function', () => {
    AbiItem.fromAbi(abi200, firstSelector)
  })
})

describe('AbiItem.fromAbi (name)', () => {
  bench('200-item ABI: last function by name', () => {
    AbiItem.fromAbi(abi200, 'fn179')
  })
})

describe('AbiItem.from', () => {
  bench('function transfer(address to, uint256 amount)', () => {
    AbiItem.from('function transfer(address to, uint256 amount) returns (bool)')
  })

  bench('struct Foo', () => {
    AbiItem.from([
      'struct Foo { address spender; uint256 amount; }',
      'function approve(Foo foo) returns (bool)',
    ])
  })
})

describe('AbiItem.format', () => {
  bench('function transfer(address to, uint256 amount)', () => {
    AbiItem.format(lastFn)
  })
})
