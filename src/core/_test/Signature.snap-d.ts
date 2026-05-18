import { attest } from '@ark/attest'
import { Hex, Signature } from 'ox'
import { test } from 'vitest'

const r = '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf'
const s = '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8'

test('default', () => {
  const signature = Signature.from({
    r,
    s,
    yParity: 1,
  })

  attest(signature).type.toString.snap(`{
  readonly r: "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf"
  readonly s: "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8"
  readonly yParity: 1
}`)
})

test('behavior: unrecovered', () => {
  const signature = Signature.from({
    r,
    s,
  })

  attest(signature).type.toString.snap(`{
  readonly r: "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf"
  readonly s: "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8"
}`)
})

test('behavior: legacy', () => {
  const signature = Signature.from({
    r,
    s,
    v: 27,
  })

  attest(signature).type.toString.snap(
    '{ r: `0x${string}`; s: `0x${string}`; yParity: number }',
  )
})

test('behavior: rpc', () => {
  const signature = Signature.from({
    r,
    s,
    yParity: Hex.fromNumber(1),
  })

  attest(signature).type.toString.snap(
    '{ r: `0x${string}`; s: `0x${string}`; yParity: number }',
  )
})

test('behavior: rpc legacy', () => {
  const signature = Signature.from({
    r,
    s,
    v: Hex.fromNumber(27),
  })

  attest(signature).type.toString.snap(
    '{ r: `0x${string}`; s: `0x${string}`; yParity: number }',
  )
})

test('behavior: widened', () => {
  const signature = Signature.from({
    r,
    s,
    yParity: 1,
  } as Signature.Signature)

  attest(signature).type.toString.snap(
    '{ r: `0x${string}`; s: `0x${string}`; yParity: number }',
  )
})

test('behavior: widened, unrecovered', () => {
  const signature = Signature.from({
    r,
    s,
  } as Signature.Signature<false>)

  attest(signature).type.toString.snap(
    '{ r: `0x${string}`; s: `0x${string}`; yParity?: undefined }',
  )
})
