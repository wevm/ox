import { Frame } from 'ox'
import { expectTypeOf, test } from 'vite-plus/test'

test('from preserves literals', () => {
  const frame = Frame.from({
    data: '0x',
    executionGas: 50_000n,
    flags: 3,
    mode: 1,
    stateGas: 0n,
    value: 0n,
  })
  expectTypeOf(frame.mode).toEqualTypeOf<1>()
  expectTypeOf(frame.executionGas).toEqualTypeOf<50_000n>()
  expectTypeOf(frame.stateGas).toEqualTypeOf<0n>()
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
    executionGas: 0n,
    flags: 0,
    // @ts-expect-error Unknown mode names are not supported.
    mode: 'unknown',
    stateGas: 0n,
    value: 0n,
  })
  Frame.from({
    data: '0x',
    // @ts-expect-error Gas budgets use bigint.
    executionGas: 1,
    flags: 0,
    mode: 1,
    stateGas: 0n,
    value: 0n,
  })
})

test('flags accept numbers and a strict named union', () => {
  const input = {
    data: '0x',
    executionGas: 0n,
    flags: 'approvePayment',
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
    executionGas: 0n,
    flags: 0,
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

test('execution gas is named explicitly', () => {
  const invalid: Frame.Frame = {
    // @ts-expect-error The execution budget is named executionGas.
    gas: 50_000n,
  }
  void invalid
})

test('destination is named to', () => {
  const frame = Frame.from({ to: '0x1111111111111111111111111111111111111111' })
  expectTypeOf(
    frame.to,
  ).toEqualTypeOf<'0x1111111111111111111111111111111111111111'>()
  const invalid: Frame.Frame = {
    // @ts-expect-error The decoded destination is named to.
    target: '0x1111111111111111111111111111111111111111',
  }
  void invalid
})
