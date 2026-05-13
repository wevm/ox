import { bench, describe } from 'vitest'
import * as TempoAddress from './TempoAddress.js'

const hexAddress = '0x742d35CC6634c0532925a3B844bc9e7595F2Bd28' as const
const tempoAddress = TempoAddress.format(hexAddress)
const lowercaseTempoAddress = tempoAddress.toLowerCase() as TempoAddress.Tempo

describe('TempoAddress.resolve', () => {
  bench('hex passthrough', () => {
    TempoAddress.resolve(hexAddress)
  })

  bench('tempo prefix', () => {
    TempoAddress.resolve(tempoAddress)
  })

  bench('tempo prefix (lowercase)', () => {
    TempoAddress.resolve(lowercaseTempoAddress)
  })
})

describe('TempoAddress.unwrap', () => {
  bench('hex passthrough', () => {
    TempoAddress.unwrap(hexAddress)
  })

  bench('tempo prefix', () => {
    TempoAddress.unwrap(tempoAddress)
  })

  bench('tempo prefix (lowercase)', () => {
    TempoAddress.unwrap(lowercaseTempoAddress)
  })
})
