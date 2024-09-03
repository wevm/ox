import { zeroPadValue } from 'ethers'

import { bench, describe } from 'vitest'

import { Bytes_padLeft } from './pad.js'

describe('Pad Bytes', () => {
  bench('ox: `Bytes.padLeft`', () => {
    Bytes_padLeft(new Uint8Array([1, 122, 51, 123]))
  })

  bench('ethers: `zeroPadValue`', () => {
    zeroPadValue(new Uint8Array([1, 122, 51, 123]), 32)
  })
})
