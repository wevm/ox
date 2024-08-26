import { stripZerosLeft } from 'ethers'
import { bench, describe } from 'vitest'

import { Bytes_trimLeft } from './trim.js'

describe('Trim Bytes', () => {
  bench('ox: `Bytes.trimLeft`', () => {
    Bytes_trimLeft(
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
