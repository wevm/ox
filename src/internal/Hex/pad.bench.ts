import { zeroPadValue } from 'ethers'

import { bench, describe } from 'vitest'

import { padLeft } from './pad.js'

describe('Pad Hex', () => {
  bench('ox: `padLeft`', () => {
    padLeft('0xa4e12a45')
  })

  bench('ethers: `zeroPadValue`', () => {
    zeroPadValue('0xa4e12a45', 32)
  })
})
