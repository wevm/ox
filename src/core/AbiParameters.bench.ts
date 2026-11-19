import { bench, describe } from 'vp/test'
import * as AbiParameters from './AbiParameters.js'

const uint256_1000 = AbiParameters.from('uint256[]')
const uint256_1000_values = Array.from({ length: 1000 }, (_, i) => BigInt(i))
const uint256_1000_encoded = AbiParameters.encode(uint256_1000, [
  uint256_1000_values,
])

const address_100 = AbiParameters.from('address[]')
const address_100_values = Array.from(
  { length: 100 },
  (_, i) => `0x${i.toString(16).padStart(40, '0')}` as `0x${string}`,
)
const address_100_encoded = AbiParameters.encode(address_100, [
  address_100_values,
])

const address_1000 = Array.from(
  { length: 1000 },
  (_, i) => `0x${i.toString(16).padStart(40, '0')}` as `0x${string}`,
)

const string_100 = AbiParameters.from('string[]')
const string_100_values = Array.from({ length: 100 }, (_, i) =>
  `string ${i} `.repeat(4),
)
const string_100_encoded = AbiParameters.encode(string_100, [string_100_values])

// Multicall3 `aggregate3` calldata arguments: 100 `balanceOf` calls.
const aggregate3 = AbiParameters.from(
  '(address target, bool allowFailure, bytes callData)[]',
)
const aggregate3_values = Array.from({ length: 100 }, (_, i) => ({
  allowFailure: i % 2 === 0,
  callData: `0x70a08231${i.toString(16).padStart(64, '0')}` as `0x${string}`,
  target: `0x${(i + 1).toString(16).padStart(40, '0')}` as `0x${string}`,
}))

const string_param = AbiParameters.from('string')
const string_value = 'a'.repeat(1024)
const string_encoded = AbiParameters.encode(string_param, [string_value])

const tuple_nested = AbiParameters.from(
  '(uint256 a, address b, bool c), (uint256 a, address b, bool c), (uint256 a, address b, bool c)',
)
const tuple_nested_values = [
  {
    a: 1n,
    b: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    c: true,
  },
  {
    a: 2n,
    b: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    c: false,
  },
  {
    a: 3n,
    b: '0x0000000000000000000000000000000000000003' as `0x${string}`,
    c: true,
  },
] as const
const tuple_nested_encoded = AbiParameters.encode(
  tuple_nested,
  tuple_nested_values as never,
)

describe('AbiParameters.encode', () => {
  bench('(uint256[1000])', () => {
    AbiParameters.encode(uint256_1000, [uint256_1000_values])
  })

  bench('(address[100])', () => {
    AbiParameters.encode(address_100, [address_100_values])
  })

  bench('(address[1000])', () => {
    AbiParameters.encode(address_100, [address_1000])
  })

  bench('aggregate3 (100 calls)', () => {
    AbiParameters.encode(aggregate3, [aggregate3_values])
  })

  bench('(string) 1KB', () => {
    AbiParameters.encode(string_param, [string_value])
  })

  bench('nested (tuple, tuple, tuple)', () => {
    AbiParameters.encode(tuple_nested, tuple_nested_values as never)
  })
})

describe('AbiParameters.decode', () => {
  bench('(uint256[1000])', () => {
    AbiParameters.decode(uint256_1000, uint256_1000_encoded)
  })

  bench('(address[100])', () => {
    AbiParameters.decode(address_100, address_100_encoded)
  })

  bench('(string) 1KB', () => {
    AbiParameters.decode(string_param, string_encoded)
  })

  bench('(string[100])', () => {
    AbiParameters.decode(string_100, string_100_encoded)
  })

  bench('nested (tuple, tuple, tuple)', () => {
    AbiParameters.decode(tuple_nested, tuple_nested_encoded)
  })
})

describe('AbiParameters.from', () => {
  bench('address spender, uint256 amount', () => {
    AbiParameters.from('address spender, uint256 amount')
  })

  bench('struct Foo', () => {
    AbiParameters.from([
      'struct Foo { address spender; uint256 amount; }',
      'Foo foo, address bar',
    ])
  })
})

describe('AbiParameters.format', () => {
  bench('address spender, uint256 amount', () => {
    AbiParameters.format([
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ])
  })
})
