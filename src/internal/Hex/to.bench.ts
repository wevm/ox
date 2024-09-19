import { getBytes, toBigInt, toUtf8String } from 'ethers'
import { bench, describe } from 'vitest'
import { Hex_toBigInt } from './toBigInt.js'
import { Hex_toBytes } from './toBytes.js'
import { Hex_toNumber } from './toNumber.js'

describe('Hex to BigInt', () => {
  bench('ox: `Hex.toBigInt`', () => {
    Hex_toBigInt('0x1a4')
  })

  bench('ethers: `toBigInt`', () => {
    toBigInt('0x1a4')
  })
})

describe('Hex to String', () => {
  bench('ox: `hexToString`', () => {
    Hex_toNumber('0x48656c6c6f20576f726c6421')
  })

  bench('ethers: `toUtf8String`', () => {
    toUtf8String('0x48656c6c6f20576f726c6421')
  })
})

describe('Hex to Bytes', () => {
  bench('ox: `Hex.toBytes`', () => {
    Hex_toBytes('0x48656c6c6f20576f726c6421')
  })

  bench('ethers: `toUtf8String`', () => {
    getBytes('0x48656c6c6f20576f726c6421')
  })
})
