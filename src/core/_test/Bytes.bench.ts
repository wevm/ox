import { Bytes, Hex } from 'ox'
import { bench, describe } from 'vitest'

describe('Bytes helpers', () => {
  const bytes = Bytes.fromHex('0xdeadbeef')
  const padded = Bytes.padLeft(bytes, 32)
  const word = Bytes.fromHex(Hex.random(32))

  bench('ox: `Bytes.padLeft`', () => {
    Bytes.padLeft(bytes, 32)
  })

  bench('ox: `Bytes.padRight`', () => {
    Bytes.padRight(bytes, 32)
  })

  bench('ox: `Bytes.trimLeft`', () => {
    Bytes.trimLeft(padded)
  })

  bench('ox: `Bytes.toBoolean` (size 32)', () => {
    Bytes.toBoolean(Bytes.padLeft(Bytes.fromBoolean(true), 32), { size: 32 })
  })

  bench('ox: `Bytes.toBigInt` (32 bytes)', () => {
    Bytes.toBigInt(word)
  })

  bench('ox: `Bytes.toBigInt` (32 bytes, small value)', () => {
    Bytes.toBigInt(padded)
  })

  bench('ox: `Bytes.toNumber` (32 bytes)', () => {
    Bytes.toNumber(padded)
  })

  bench('ox: `Bytes.validate` (invalid)', () => {
    Bytes.validate('0xdeadbeef')
  })
})
