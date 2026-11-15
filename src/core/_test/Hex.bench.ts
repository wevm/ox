import { bytesToHex as bytesToHex_ethjs } from '@ethereumjs/util'
import * as ethers from 'ethers'
import { bench, describe } from 'vitest'
import { Bytes } from '../../index.js'
import * as Hex from '../Hex.js'

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

describe('Hex.fromBytes', () => {
  const bytes20 = Bytes.random(20)
  const bytes32 = Bytes.random(32)
  const bytes1k = Bytes.random(1024)
  const bytes64k = Bytes.random(65_536)

  bench('ox: 20 bytes', () => {
    Hex.fromBytes(bytes20)
  })

  bench('ox: 32 bytes', () => {
    Hex.fromBytes(bytes32)
  })

  bench('ox: 1 KiB', () => {
    Hex.fromBytes(bytes1k)
  })

  bench('ox: 64 KiB', () => {
    Hex.fromBytes(bytes64k)
  })
})

describe('Hex.toBytes', () => {
  const hex20 = Hex.random(20)
  const hex32 = Hex.random(32)
  const hex1k = Hex.random(1024)
  const hex64k = Hex.random(65_536)

  bench('ox: 20 bytes', () => {
    Hex.toBytes(hex20)
  })

  bench('ox: 32 bytes', () => {
    Hex.toBytes(hex32)
  })

  bench('ox: 1 KiB', () => {
    Hex.toBytes(hex1k)
  })

  bench('ox: 64 KiB', () => {
    Hex.toBytes(hex64k)
  })
})

describe('Hex.fromNumber', () => {
  bench('ox: number', () => {
    Hex.fromNumber(420_690)
  })

  bench('ox: bigint', () => {
    Hex.fromNumber(420_690_000_000_000_000_000n)
  })

  bench('ox: bigint, size 32', () => {
    Hex.fromNumber(420_690_000_000_000_000_000n, { size: 32 })
  })

  bench('ox: signed, size 32', () => {
    Hex.fromNumber(-420_690n, { signed: true, size: 32 })
  })
})

describe('Hex helpers', () => {
  const hex = Hex.random(32)
  const padded = Hex.padLeft('0xdeadbeef', 32)
  const large = Hex.random(65_536)

  bench('ox: `Hex.concat` (4 x 32 bytes)', () => {
    Hex.concat(hex, hex, hex, hex)
  })

  bench('ox: `Hex.slice`', () => {
    Hex.slice(hex, 4, 24)
  })

  bench('ox: `Hex.slice` (64 KiB)', () => {
    Hex.slice(large, 4, 36)
  })

  bench('ox: `Hex.padLeft`', () => {
    Hex.padLeft('0xdeadbeef', 32)
  })

  bench('ox: `Hex.trimLeft`', () => {
    Hex.trimLeft(padded)
  })

  bench('ox: `Hex.toString`', () => {
    Hex.toString('0x48656c6c6f20776f726c642e')
  })

  bench('ox: `Hex.validate` (valid)', () => {
    Hex.validate(hex)
  })

  bench('ox: `Hex.validate` (invalid)', () => {
    Hex.validate('deadbeef')
  })
})
