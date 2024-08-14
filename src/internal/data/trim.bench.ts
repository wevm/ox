import { stripZerosLeft } from 'ethers'
import { bench, describe } from 'vitest'

import { trimLeft } from './trim.js'

describe('Trim Hex', () => {
  bench('ox: `trimLeft`', () => {
    trimLeft('0x00000000000000000000000a4e12a45')
  })

  bench('ethers: `stripZerosLeft`', () => {
    stripZerosLeft('0x00000000000000000000000a4e12a45a')
  })
})

describe('Trim Bytes', () => {
  bench('ox: `trimLeft`', () => {
    trimLeft(
      new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 122, 51, 123,
      ]),
    )
  })

  bench('ethers: `stripZerosLeft`', () => {
    stripZerosLeft(
      new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 122, 51,
        123,
      ]),
    )
  })
})
