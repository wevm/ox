import { bytesToHex as bytesToHex_ethjs } from '@ethereumjs/util'
import * as ethers from 'ethers'
import { bench, describe } from 'vitest'
import * as Hex from '../Hex.js'
import { Bytes } from '../index.js'

// TODO: random hex
describe('concat (hex)', () => {
  bench('ox', () => {
    Hex.concat(
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
    )
  })

  bench('ethers', () => {
    ethers.concat([
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
      '0xdeadbeefdeadbeefdeadbeef',
    ])
  })
})

describe('number to hex', () => {
  bench('ox: `Hex.fromNumber`', () => {
    Hex.fromNumber(52)
  })

  bench('ethers: `hexlify`', () => {
    ethers.toBeHex(52)
  })
})

describe('string to hex', () => {
  bench('ox: `Hex.fromString`', () => {
    Hex.fromString('Hello world.')
  })

  bench('ethers: `hexlify`', () => {
    ethers.hexlify(ethers.toUtf8Bytes('Hello world.'))
  })
})

describe('bytes to hex', () => {
  const bytes = Bytes.random(1024)

  bench('ox: `Hex.fromBytes`', () => {
    Hex.fromBytes(bytes)
  })

  bench('ethers: `bytesToHex`', () => {
    ethers.hexlify(new Uint8Array(bytes))
  })

  bench('@ethereumjs/util: `bytesToHex`', () => {
    bytesToHex_ethjs(bytes)
  })
})
