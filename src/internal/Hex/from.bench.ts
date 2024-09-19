import { bytesToHex as bytesToHex_ethjs } from '@ethereumjs/util'
import { hexlify, toBeHex, toUtf8Bytes } from 'ethers'
import { Bytes } from 'ox'
import { bench, describe } from 'vitest'
import { Hex_fromBytes } from './fromBytes.js'
import { Hex_fromNumber } from './fromNumber.js'
import { Hex_fromString } from './fromString.js'

describe('Number to Hex', () => {
  bench('ox: `Hex.fromNumber`', () => {
    Hex_fromNumber(52)
  })

  bench('ethers: `hexlify`', () => {
    toBeHex(52)
  })
})

describe('String to Hex', () => {
  bench('ox: `Hex.fromString`', () => {
    Hex_fromString('Hello world.')
  })

  bench('ethers: `hexlify`', () => {
    hexlify(toUtf8Bytes('Hello world.'))
  })
})

describe('Bytes to Hex', () => {
  const bytes = Bytes.random(1024)

  bench('ox: `Hex.fromBytes`', () => {
    Hex_fromBytes(bytes)
  })

  bench('ethers: `bytesToHex`', () => {
    hexlify(new Uint8Array(bytes))
  })

  bench('@ethereumjs/util: `bytesToHex`', () => {
    bytesToHex_ethjs(bytes)
  })
})
