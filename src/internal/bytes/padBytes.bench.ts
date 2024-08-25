import { zeroPadValue } from 'ethers'

import { bench, describe } from 'vitest'

import { padLeft } from './padBytes.js'

describe('Pad Bytes', () => {
  bench('ox: `padLeft`', () => {
    padLeft(new Uint8Array([1, 122, 51, 123]))
  })

  bench('ethers: `zeroPadValue`', () => {
    zeroPadValue(new Uint8Array([1, 122, 51, 123]), 32)
  })
})
