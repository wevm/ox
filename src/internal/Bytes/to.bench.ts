import * as ethjs from '@ethereumjs/util'
import { hexlify, toBigInt, toNumber, toUtf8String } from 'ethers'
import { bench, describe } from 'vitest'

import { Hex } from '../../Hex.js'
import { Bytes_toBigInt } from './toBigInt.js'
import { Bytes_toNumber } from './toNumber.js'
import { Bytes_toString } from './toString.js'

describe('Bytes to Hex', () => {
  bench('ox: `Hex.fromBytes`', () => {
    Hex.fromBytes(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })

  bench('ethers: `hexlify`', () => {
    hexlify(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })

  bench('@ethereumjs/util: `bytesToHex`', () => {
    ethjs.bytesToHex(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })
})

describe('Bytes to String', () => {
  bench('ox: `Bytes.toString`', () => {
    Bytes_toString(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })

  bench('ethers: `toUtf8String`', () => {
    toUtf8String(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })

  bench('@ethereumjs/util: `bytesToUtf8`', () => {
    ethjs.bytesToUtf8(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })
})

describe('Bytes to BigInt', () => {
  bench('ox: `Bytes.toNumber`', () => {
    Bytes_toBigInt(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })

  bench('ethers: `toBigInt`', () => {
    toBigInt(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })

  bench('@ethereumjs/util: `bytesToBigInt`', () => {
    ethjs.bytesToBigInt(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
    )
  })
})

describe('Bytes to Number', () => {
  bench('ox: `Bytes.toNumber`', () => {
    Bytes_toNumber(new Uint8Array([72, 101]))
  })

  bench('ethers: `toNumber`', () => {
    toNumber(new Uint8Array([72, 101]))
  })

  bench('@ethereumjs/util: `bytesToInt`', () => {
    ethjs.bytesToInt(new Uint8Array([72, 101]))
  })
})
