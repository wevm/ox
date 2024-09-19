import * as ethjs from '@ethereumjs/util'
import { hexToBytes as hexToBytes_noble } from '@noble/hashes/utils'
import { toBeArray, toUtf8Bytes } from 'ethers'
import { Bytes } from 'ox'
import {
  hexToBytes as hexToBytes_viem,
  numberToBytes,
  stringToBytes,
} from 'viem'
import { bench, describe } from 'vitest'
import { Bytes_fromHex } from './fromHex.js'
import { Bytes_fromNumber } from './fromNumber.js'
import { Bytes_fromString } from './fromString.js'

describe('Bytes from Hex', () => {
  const hex = Bytes.toHex(Bytes.random(1024))

  bench('ox: `Bytes.from`', () => {
    Bytes_fromHex(hex)
  })

  bench('viem: `hexToBytes`', () => {
    hexToBytes_viem(hex)
  })

  bench('@noble/hashes: `hexToBytes`', () => {
    hexToBytes_noble(hex.slice(2))
  })

  bench('ethers: `toBeArray`', () => {
    toBeArray(hex)
  })

  bench('@ethereumjs/util: `hexToBytes`', () => {
    ethjs.hexToBytes(hex)
  })
})

describe('Bytes from Number', () => {
  const number = 69420

  bench('ox: `Bytes.from`', () => {
    Bytes_fromNumber(number)
  })

  bench('viem: `numberToBytes`', () => {
    numberToBytes(number)
  })

  bench('ethers: `toBeArray`', () => {
    toBeArray(number)
  })

  bench('@ethereumjs/util: `intToBytes`', () => {
    ethjs.intToBytes(number)
  })
})

describe('Bytes from String', () => {
  const string = 'hello world'

  bench('ox: `Bytes.from`', () => {
    Bytes_fromString(string)
  })

  bench('viem: `stringToBytes`', () => {
    stringToBytes(string)
  })

  bench('ethers: `toUtf8Bytes`', () => {
    toUtf8Bytes(string)
  })

  bench('@ethereumjs/util: `utf8ToBytes`', () => {
    ethjs.utf8ToBytes(string)
  })
})
