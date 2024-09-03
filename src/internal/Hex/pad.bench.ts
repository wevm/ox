import { zeroPadValue } from 'ethers'

import { bench, describe } from 'vitest'

import { Hex_padLeft } from './pad.js'

describe('Pad Hex', () => {
  bench('ox: `padLeft`', () => {
    Hex_padLeft('0xa4e12a45')
  })

  bench('ethers: `zeroPadValue`', () => {
    zeroPadValue('0xa4e12a45', 32)
  })
})
