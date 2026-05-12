import { bench, describe } from 'vitest'
import * as Hex from './Hex.js'

const hex8: Hex.Hex = '0xdeadbeef'
const hex32: Hex.Hex = `0x${'a'.repeat(64)}` as Hex.Hex
const hex65: Hex.Hex = `0x${'b'.repeat(130)}` as Hex.Hex

describe('Hex.concat', () => {
  bench('2 args', () => {
    Hex.concat(hex32, hex32)
  })

  bench('3 args', () => {
    Hex.concat(hex32, hex32, '0x1c' as Hex.Hex)
  })

  bench('8 args', () => {
    Hex.concat(hex8, hex8, hex8, hex8, hex8, hex8, hex8, hex8)
  })
})

describe('Hex.slice', () => {
  bench('positive start, no end', () => {
    Hex.slice(hex65, 1)
  })

  bench('positive start + end', () => {
    Hex.slice(hex65, 0, 32)
  })

  bench('negative start', () => {
    Hex.slice(hex65, -32)
  })
})
