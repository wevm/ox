import { RLP } from '@ethereumjs/rlp'
import * as ethers from 'ethers'
import { Rlp } from 'ox'
import { bench, describe } from 'vitest'
import { Rlp_toBytes } from './to.js'

const generateBytes = (length: number) => {
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) bytes[i] = i
  return bytes
}

const generateList = (length: number) => {
  const bytes = []
  for (let i = 0; i < length; i++) bytes[i] = generateBytes(i)
  return bytes
}

describe('rlp: prefix === 0xb8', () => {
  const bytes = Rlp.fromBytes(generateBytes(255))

  bench('ox: `Rlp.toBytes`', () => {
    Rlp_toBytes(bytes)
  })

  bench('ethers: `decodeRlp`', () => {
    ethers.decodeRlp(bytes as any)
  })

  bench('@ethereumjs/rlp: `RLP.decode`', () => {
    RLP.decode(bytes)
  })
})

describe('rlp: prefix === 0xb9', () => {
  const bytes = Rlp.fromBytes(generateBytes(65_535))

  bench('ox: `Rlp.toBytes`', () => {
    Rlp_toBytes(bytes)
  })

  bench('ethers: `decodeRlp`', () => {
    ethers.decodeRlp(bytes as any)
  })

  bench('@ethereumjs/rlp: `RLP.decode`', () => {
    RLP.decode(bytes)
  })
})

describe('rlp: prefix === 0xba', () => {
  const bytes = Rlp.fromBytes(generateBytes(16_777_215))

  bench('ox: `Rlp.toBytes`', () => {
    Rlp_toBytes(bytes)
  })

  bench.skip('ethers: `decodeRlp`', () => {
    ethers.decodeRlp(bytes as any)
  })

  bench('@ethereumjs/rlp: `RLP.decode`', () => {
    RLP.decode(bytes)
  })
})

describe('rlp list: prefix === 0xf8', () => {
  const list = Rlp.fromBytes(generateList(60))

  bench('ox: `Rlp.toBytes`', () => {
    Rlp_toBytes(list)
  })

  bench('ethers: `decodeRlp`', () => {
    ethers.decodeRlp(list as any)
  })

  bench('@ethereumjs/rlp: `RLP.decode`', () => {
    RLP.decode(list)
  })
})

describe('rlp list: prefix === 0xf8 (recursive)', () => {
  const list = Rlp.fromBytes([
    generateList(4),
    [generateList(8), [generateList(3), generateBytes(1)]],
    [
      generateList(10),
      [
        generateList(5),
        generateBytes(2),
        [generateList(10), [generateList(20)]],
      ],
    ],
  ])

  bench('ox: `Rlp.toBytes`', () => {
    Rlp_toBytes(list)
  })

  bench('ethers: `decodeRlp`', () => {
    ethers.decodeRlp(list as any)
  })

  bench('@ethereumjs/rlp: `RLP.decode`', () => {
    RLP.decode(list)
  })
})

describe('rlp: tx (2048kB - prefix: 0xfa)', () => {
  const list = Rlp.fromBytes([
    generateBytes(1),
    generateBytes(4),
    generateBytes(8),
    generateBytes(8),
    generateBytes(4),
    generateBytes(20),
    generateBytes(8),
    generateBytes(2_048_000),
  ])

  bench('ox: `Rlp.toBytes`', () => {
    Rlp_toBytes(list)
  })

  bench('ethers: `decodeRlp`', () => {
    ethers.decodeRlp(list as any)
  })

  bench('@ethereumjs/rlp: `RLP.decode`', () => {
    RLP.decode(list, true)
  })
})
