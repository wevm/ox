import * as ethjs from '@ethereumjs/util'
import { toBeArray } from 'ethers'
import { Bytes } from 'ox'
import { bench, describe } from 'vitest'
import { hexToBytes } from './toBytes.js'

describe('Hex to Bytes', () => {
  const hex = Bytes.toHex(Bytes.random(1024))

  bench('ox: `Bytes.from`', () => {
    hexToBytes(hex)
  })

  bench('ethers: `toBeArray`', () => {
    toBeArray(hex)
  })

  bench('@ethereumjs/util: `hexToBytes`', () => {
    ethjs.hexToBytes(hex)
  })
})
