import { stripZerosLeft } from 'ethers'
import { bench, describe } from 'vitest'

import { Hex_trimLeft } from './trim.js'

describe('Trim Hex', () => {
  bench('ox: `Hex.trimLeft`', () => {
    Hex_trimLeft('0x00000000000000000000000a4e12a45')
  })

  bench('ethers: `stripZerosLeft`', () => {
    stripZerosLeft('0x00000000000000000000000a4e12a45a')
  })
})
