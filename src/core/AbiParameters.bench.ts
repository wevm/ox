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

  bench('nested (tuple, tuple, tuple)', () => {
    AbiParameters.decode(tuple_nested, tuple_nested_encoded)
  })
})
