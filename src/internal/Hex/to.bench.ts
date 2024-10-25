import { toBigInt as ethers_toBigInt, getBytes, toUtf8String } from 'ethers'
import { bench, describe } from 'vitest'
import { toBigInt } from './toBigInt.js'
import { toBytes } from './toBytes.js'
import { toNumber } from './toNumber.js'

describe('Hex to BigInt', () => {
  bench('ox: `Hex.toBigInt`', () => {
    toBigInt('0x1a4')
  })

  bench('ethers: `toBigInt`', () => {
    ethers_toBigInt('0x1a4')
  })
})

describe('Hex to String', () => {
  bench('ox: `hexToString`', () => {
    toNumber('0x48656c6c6f20576f726c6421')
  })

  bench('ethers: `toUtf8String`', () => {
    toUtf8String('0x48656c6c6f20576f726c6421')
  })
})

describe('Hex to Bytes', () => {
  bench('ox: `Hex.toBytes`', () => {
    toBytes('0x48656c6c6f20576f726c6421')
  })

  bench('ethers: `toUtf8String`', () => {
    getBytes('0x48656c6c6f20576f726c6421')
  })
})
