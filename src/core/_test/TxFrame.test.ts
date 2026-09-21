import { describe, expect, test } from 'vite-plus/test'
import { Rlp, TxFrame } from 'ox'

const frame = {
  mode: 1,
  flags: 3,
  executionGasLimit: 50_000n,
  stateGasLimit: 0n,
  value: 0n,
  data: '0x',
} as const

const tuple = ['0x01', '0x03', '0x', ['0xc350', '0x'], '0x', '0x'] as const

describe('from', () => {
  test('copies the frame without changing its fields', () => {
    const result = TxFrame.from(frame)
    expect(result).toEqual(frame)
    expect(result).not.toBe(frame)
  })
})

describe('toTuple', () => {
  test('encodes the specification field order', () => {
    expect(TxFrame.toTuple(frame)).toEqual(tuple)
    expect(Rlp.fromHex(TxFrame.toTuple(frame))).toMatchInlineSnapshot(
      '"0xca010380c482c350808080"',
    )
  })

  test('encodes zero integers as empty bytes', () => {
    expect(
      Rlp.fromHex(
        TxFrame.toTuple({ ...frame, mode: 0, flags: 0, executionGasLimit: 0n }),
      ),
    ).toMatchInlineSnapshot('"0xc8808080c280808080"')
  })

  test('preserves large integers and opaque data', () => {
    const input = {
      ...frame,
      mode: 2,
      flags: 0,
      executionGasLimit: 2n ** 63n,
      stateGasLimit: 2n ** 63n - 1n,
      value: 2n ** 256n - 1n,
      data: '0x0001',
    } as const
    expect(TxFrame.fromTuple(TxFrame.toTuple(input))).toEqual(input)
  })
})

describe('fromTuple', () => {
  test('decodes a fixed tuple', () => {
    expect(TxFrame.fromTuple(tuple)).toEqual(frame)
  })

  test('distinguishes an implicit target from the zero address', () => {
    const target = '0x0000000000000000000000000000000000000000'
    expect(TxFrame.fromTuple(tuple)).not.toHaveProperty('target')
    expect(
      TxFrame.fromTuple([
        tuple[0],
        tuple[1],
        target,
        tuple[3],
        tuple[4],
        tuple[5],
      ]),
    ).toHaveProperty('target', target)
  })

  test.each(['0x00', '0x0001', '0x1', '0xgg'])(
    'rejects noncanonical integer %s',
    (value) => {
      expect(() =>
        TxFrame.fromTuple([value, ...tuple.slice(1)] as never),
      ).toThrow()
    },
  )

  test.each([
    [],
    [...tuple, '0x'],
    [tuple[0], tuple[1], '0x', [], '0x', '0x'],
    [tuple[0], tuple[1], '0x', '0x', '0x', '0x'],
    [tuple[0], tuple[1], undefined, tuple[3], '0x', '0x'],
    [tuple[0], tuple[1], '0x01', tuple[3], '0x', '0x'],
  ])('rejects malformed tuple %#', (...value) => {
    expect(() => TxFrame.fromTuple(value as never)).toThrow()
  })
})

describe('assert', () => {
  test.each([
    { mode: -1 },
    { mode: 3 },
    { mode: 0.5 },
    { mode: NaN },
    { flags: -1 },
    { flags: 8 },
    { flags: 1.5 },
    { mode: 1, flags: 4 },
    { mode: 2, flags: 5 },
    { value: 1n },
    { mode: 2, value: -1n },
    { mode: 2, value: 2n ** 256n },
    { executionGasLimit: -1n },
    { executionGasLimit: 2n ** 64n },
    { stateGasLimit: -1n },
    { stateGasLimit: 2n ** 64n },
    { executionGasLimit: 2n ** 64n - 1n, stateGasLimit: 1n },
    { data: '0x0' },
    { data: '0xgg' },
    { target: '0x01' },
  ])('rejects invalid fields %#', (fields) => {
    expect(() => TxFrame.assert({ ...frame, ...fields } as never)).toThrow()
  })

  test('leaves batch adjacency to the envelope', () => {
    expect(() => TxFrame.assert({ ...frame, mode: 2, flags: 4 })).not.toThrow()
  })
})

describe('validate', () => {
  test('returns structural validity', () => {
    expect(TxFrame.validate(frame)).toBe(true)
    expect(TxFrame.validate({ ...frame, value: 1n })).toBe(false)
  })
})
