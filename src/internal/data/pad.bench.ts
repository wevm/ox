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

describe('Pad Bytes', () => {
  bench('ox: `padLeft`', () => {
    padLeft(new Uint8Array([1, 122, 51, 123]))
  })

  bench('ethers: `zeroPadValue`', () => {
    zeroPadValue(new Uint8Array([1, 122, 51, 123]), 32)
  })
})
