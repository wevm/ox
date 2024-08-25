import { stripZerosLeft } from 'ethers'
import { bench, describe } from 'vitest'

import { trimLeft } from './trimHex.js'

describe('Trim Hex', () => {
  bench('ox: `trimLeft`', () => {
    trimLeft('0x00000000000000000000000a4e12a45')
  })

  bench('ethers: `stripZerosLeft`', () => {
    stripZerosLeft('0x00000000000000000000000a4e12a45a')
  })
})
