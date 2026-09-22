import { Frame } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('from preserves literals', () => {
  const frame = Frame.from({
    data: '0x',
    flags: 3,
    gas: 50_000n,
    mode: 1,
    stateGas: 0n,
    value: 0n,
  })
  expectTypeOf(frame.mode).toEqualTypeOf<1>()
  expectTypeOf(frame.gas).toEqualTypeOf<50_000n>()
  expectTypeOf(Frame.toTuple(frame)).toEqualTypeOf<Frame.Tuple>()
})

test('tuple accepts readonly input', () => {
  expectTypeOf(
    Frame.fromTuple([
      '0x01',
      '0x03',
      '0x',
      ['0xc350', '0x'],
      '0x',
      '0x',
    ] as const),
  ).toEqualTypeOf<Frame.Frame>()
})

test('rejects unsupported modes and unsafe numeric budgets', () => {
  Frame.from({
    data: '0x',
    flags: 0,
    gas: 0n,
    // @ts-expect-error Unknown mode names are not supported.
    mode: 'unknown',
    stateGas: 0n,
    value: 0n,
  })
  Frame.from({
    data: '0x',
    flags: 0,
    // @ts-expect-error Gas budgets use bigint.
    gas: 1,
    mode: 1,
    stateGas: 0n,
    value: 0n,
  })
})

test('flags accept numbers and a strict named union', () => {
  const input = {
    data: '0x',
    flags: 'approvePayment',
    gas: 0n,
    mode: 1,
    stateGas: 0n,
    value: 0n,
  } as const
  expectTypeOf(Frame.from(input).flags).toEqualTypeOf<'approvePayment'>()
  expectTypeOf<Frame.Flags>().toEqualTypeOf<
    | number
    | 'none'
    | 'approvePayment'
    | 'approveExecution'
    | 'approveExecutionAndPayment'
    | 'atomicBatch'
  >()
  // @ts-expect-error Unknown flag names are not supported.
  Frame.from({ ...input, flags: 'unknown' })
})

test('mode accepts numbers and a strict named union', () => {
  const frame = Frame.from({
    data: '0x',
    flags: 0,
    gas: 0n,
    mode: 'sender',
    stateGas: 0n,
    value: 1n,
  })
  expectTypeOf(frame.mode).toEqualTypeOf<'sender'>()
  expectTypeOf<Frame.Mode>().toEqualTypeOf<
    number | 'default' | 'verify' | 'sender'
  >()
})

test('allows omitted zero fields without widening supplied literals', () => {
  expectTypeOf(Frame.from({})).toEqualTypeOf<{}>()
  const frame = Frame.from({ mode: 'verify' })
  expectTypeOf(frame.mode).toEqualTypeOf<'verify'>()
  expectTypeOf(
    Frame.toTuple({ mode: 'sender', value: 1n }),
  ).toEqualTypeOf<Frame.Tuple>()
})
