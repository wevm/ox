import { Frame } from 'ox'
import { expectTypeOf, test } from 'vite-plus/test'

test('from preserves literals', () => {
  const frame = Frame.from({
    mode: 1,
    flags: 3,
    executionGasLimit: 50_000n,
    stateGasLimit: 0n,
    value: 0n,
    data: '0x',
  })
  expectTypeOf(frame.mode).toEqualTypeOf<1>()
  expectTypeOf(frame.executionGasLimit).toEqualTypeOf<50_000n>()
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
    // @ts-expect-error Unsupported execution mode.
    mode: 3,
    flags: 0,
    executionGasLimit: 0n,
    stateGasLimit: 0n,
    value: 0n,
    data: '0x',
  })
  Frame.from({
    mode: 1,
    flags: 0,
    // @ts-expect-error Gas budgets use bigint.
    executionGasLimit: 1,
    stateGasLimit: 0n,
    value: 0n,
    data: '0x',
  })
})
