import { bench, describe } from 'vitest'
import { hexToNumber } from './fromHex.js'

describe.skip('Hex to Number', () => {
  bench('ox: `hexToNumber`', () => {
    hexToNumber('0x1a4')
  })
})

describe.skip('Hex to String', () => {
  bench('ox: `hexToString`', () => {
    hexToNumber('0x48656c6c6f20576f726c6421')
  })
})
