import { bench, describe } from 'vitest'
import { Hex_toNumber } from './to.js'

describe.skip('Hex to Number', () => {
  bench('ox: `Hex.toNumber`', () => {
    Hex_toNumber('0x1a4')
  })
})

describe.skip('Hex to String', () => {
  bench('ox: `hexToString`', () => {
    Hex_toNumber('0x48656c6c6f20576f726c6421')
  })
})
