import { zeroPadValue } from 'ethers'
import { Bytes } from 'ox'
import { bench, describe } from 'vitest'

describe('Pad Bytes', () => {
  bench('ox: `Bytes.padLeft`', () => {
    Bytes.padLeft(new Uint8Array([1, 122, 51, 123]))
  })

  bench('ethers: `zeroPadValue`', () => {
    zeroPadValue(new Uint8Array([1, 122, 51, 123]), 32)
  })
})
