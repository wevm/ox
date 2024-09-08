import { attest } from '@ark/attest'
import { AbiError, Hex } from 'ox'
import { test } from 'vitest'

test('behavior: no args', () => {
  const error = AbiError.from('error Example()')
  const data = AbiError.getSelector(error)
  const decoded = AbiError.decode(error, data)
  attest(decoded).type.toString.snap('undefined')
})

test('behavior: single arg', () => {
  const error = AbiError.from('error Example(uint256 a)')
  const data = Hex.concat(
    AbiError.getSelector(error),
    Hex.from(1n, { size: 32 }),
  )
  const decoded = AbiError.decode(error, data)
  attest(decoded).type.toString.snap('bigint')
})

test('behavior: multiple args', () => {
  const error = AbiError.from('error Example(uint256 a, uint256 b)')
  const data = Hex.concat(
    AbiError.getSelector(error),
    Hex.from(420n, { size: 32 }),
    Hex.from(69n, { size: 32 }),
  )
  const decoded = AbiError.decode(error, data)
  attest(decoded).type.toString.snap('readonly [bigint, bigint]')
})

test('behavior: as = Object', () => {
  const error = AbiError.from('error Example(uint256 a, uint256 b)')
  const data = Hex.concat(
    AbiError.getSelector(error),
    Hex.from(420n, { size: 32 }),
    Hex.from(69n, { size: 32 }),
  )
  const decoded = AbiError.decode(error, data, { as: 'Object' })
  attest(decoded).type.toString.snap('{ a: bigint; b: bigint }')
})

test('behavior: as = Object, single arg', () => {
  const error = AbiError.from('error Example(uint256 a)')
  const data = Hex.concat(
    AbiError.getSelector(error),
    Hex.from(420n, { size: 32 }),
    Hex.from(69n, { size: 32 }),
  )
  const decoded = AbiError.decode(error, data, { as: 'Object' })
  attest(decoded).type.toString.snap('bigint')
})
