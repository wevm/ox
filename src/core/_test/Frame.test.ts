import { Frame, Rlp } from 'ox'
import { describe, expect, test } from 'vitest'

const frame = {
  data: '0x',
  executionGas: 50_000n,
  flags: 3,
  mode: 1,
  stateGas: 0n,
  value: 0n,
} as const

const tuple = ['0x01', '0x03', '0x', ['0xc350', '0x'], '0x', '0x'] as const

describe('from', () => {
  test('preserves omitted fields', () => {
    expect(Frame.from({ mode: 'verify' })).toEqual({ mode: 'verify' })
    expect(Frame.from({})).toEqual({})
  })

  test('copies the frame without changing its fields', () => {
    const result = Frame.from(frame)
    expect(result).toEqual(frame)
    expect(result).not.toBe(frame)
  })
})

describe('toTuple', () => {
  test('encodes defaults for omitted fields', () => {
    expect(Frame.toTuple({})).toEqual([
      '0x',
      '0x',
      '0x',
      ['0x', '0x'],
      '0x',
      '0x',
    ])
    expect(
      Frame.toTuple({
        data: undefined,
        executionGas: undefined,
        flags: undefined,
        mode: undefined,
        stateGas: undefined,
        value: undefined,
      }),
    ).toEqual(Frame.toTuple({}))
    expect(
      Frame.toTuple({
        executionGas: 50_000n,
        flags: 'approveExecutionAndPayment',
        mode: 'verify',
      }),
    ).toEqual(tuple)
  })

  test.each([
    ['default', 0],
    ['verify', 1],
    ['sender', 2],
  ] as const)('encodes named mode %s as %i', (mode, numeric) => {
    const input = { ...frame, mode }
    const encoded = Frame.toTuple(input)
    expect(encoded).toEqual(Frame.toTuple({ ...input, mode: numeric }))
    expect(encoded[0]).toBe(numeric === 0 ? '0x' : `0x0${numeric}`)
    expect(Frame.from(input).mode).toBe(mode)
    expect(Frame.fromTuple(encoded).mode).toBe(numeric)
  })

  test('encodes value transfers in sender mode', () => {
    expect(
      Frame.toTuple({ ...frame, flags: 'none', mode: 'sender', value: 1n }),
    ).toEqual(['0x02', '0x', '0x', ['0xc350', '0x'], '0x01', '0x'])
  })

  test.each([
    ['none', 0],
    ['approvePayment', 1],
    ['approveExecution', 2],
    ['approveExecutionAndPayment', 3],
    ['atomicBatch', 4],
  ] as const)('encodes named flag %s as %i', (flags, numeric) => {
    const input = { ...frame, flags, mode: 2 } as const
    const encoded = Frame.toTuple(input)
    expect(encoded).toEqual(Frame.toTuple({ ...input, flags: numeric }))
    expect(encoded[1]).toBe(numeric === 0 ? '0x' : `0x0${numeric}`)
    expect(Frame.from(input).flags).toBe(flags)
    expect(Frame.fromTuple(encoded).flags).toBe(numeric)
  })

  test('encodes the specification field order', () => {
    expect(Frame.toTuple(frame)).toEqual(tuple)
    expect(Rlp.fromHex(Frame.toTuple(frame))).toMatchInlineSnapshot(
      '"0xca010380c482c350808080"',
    )
  })

  test('preserves separate execution and state gas budgets', () => {
    const frame = Frame.from({ executionGas: 50_000n, stateGas: 12n })
    const tuple = Frame.toTuple(frame)
    expect(tuple).toEqual(['0x', '0x', '0x', ['0xc350', '0x0c'], '0x', '0x'])
    expect(Frame.fromTuple(tuple)).toEqual({
      data: '0x',
      executionGas: 50_000n,
      flags: 0,
      mode: 0,
      stateGas: 12n,
      value: 0n,
    })
  })

  test('encodes zero integers as empty bytes', () => {
    expect(
      Rlp.fromHex(
        Frame.toTuple({ ...frame, executionGas: 0n, flags: 0, mode: 0 }),
      ),
    ).toMatchInlineSnapshot('"0xc8808080c280808080"')
  })

  test('preserves large integers and opaque data', () => {
    const input = {
      ...frame,
      data: '0x0001',
      executionGas: 2n ** 63n,
      flags: 0,
      mode: 2,
      stateGas: 2n ** 63n - 1n,
      value: 2n ** 256n - 1n,
    } as const
    expect(Frame.fromTuple(Frame.toTuple(input))).toEqual(input)
  })
})

describe('fromTuple', () => {
  test('decodes a fixed tuple', () => {
    expect(Frame.fromTuple(tuple)).toEqual(frame)
  })

  test('distinguishes an implicit target from the zero address', () => {
    const target = '0x0000000000000000000000000000000000000000'
    expect(Frame.fromTuple(tuple)).not.toHaveProperty('to')
    expect(
      Frame.fromTuple([
        tuple[0],
        tuple[1],
        target,
        tuple[3],
        tuple[4],
        tuple[5],
      ]),
    ).toHaveProperty('to', target)
  })

  test.each(['0x00', '0x0001', '0x1', '0xgg'])(
    'rejects noncanonical integer %s',
    (value) => {
      expect(() =>
        Frame.fromTuple([value, ...tuple.slice(1)] as never),
      ).toThrow()
    },
  )

  test.each([
    [],
    [...tuple, '0x'],
    [tuple[0], tuple[1], '0x', [], '0x', '0x'],
    [tuple[0], tuple[1], '0x', '0x', '0x', '0x'],
    [tuple[0], tuple[1], undefined, tuple[3], '0x', '0x'],
    [tuple[0], tuple[1], '0x', tuple[3], '0x', undefined],
    [tuple[0], tuple[1], '0x01', tuple[3], '0x', '0x'],
  ])('rejects malformed tuple %#', (...value) => {
    expect(() => Frame.fromTuple(value as never)).toThrow()
  })
})

describe('assert', () => {
  test('reports the execution gas field', () => {
    expect(() =>
      Frame.assert({ executionGas: -1n }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Frame.InvalidError: Invalid frame.

Details: executionGas must be an unsigned 64-bit integer.]`,
    )
  })

  test.each([
    { data: null },
    { flags: null },
    { executionGas: null },
    { mode: null },
    { stateGas: null },
    { value: null },
    { mode: -1 },
    { mode: 3 },
    { mode: 0.5 },
    { mode: NaN },
    { mode: 'unknown' },
    { mode: 'toString' },
    { flags: 'atomicBatch', mode: 'verify' },
    { mode: 'verify', value: 1n },
    { mode: 'default', value: 1n },
    { flags: -1 },
    { flags: 8 },
    { flags: 1.5 },
    { flags: 'unknown' },
    { flags: 'toString' },
    { flags: 'atomicBatch', mode: 1 },
    { flags: 4, mode: 1 },
    { flags: 5, mode: 2 },
    { value: 1n },
    { mode: 2, value: -1n },
    { mode: 2, value: 2n ** 256n },
    { executionGas: -1n },
    { executionGas: 2n ** 64n },
    { stateGas: -1n },
    { stateGas: 2n ** 64n },
    { executionGas: 2n ** 64n - 1n, stateGas: 1n },
    { data: '0x0' },
    { data: '0xgg' },
    { to: '0x01' },
  ])('rejects invalid fields %#', (fields) => {
    expect(() => Frame.assert({ ...frame, ...fields } as never)).toThrow()
  })

  test('leaves batch adjacency to the envelope', () => {
    expect(() => Frame.assert({ ...frame, flags: 4, mode: 2 })).not.toThrow()
  })
})

describe('validate', () => {
  test('validates omitted fields using their defaults', () => {
    expect(Frame.validate({})).toBe(true)
    expect(Frame.validate({ value: 1n })).toBe(false)
    expect(Frame.validate({ mode: 'sender', value: 1n })).toBe(true)
    expect(Frame.validate({ flags: 'atomicBatch', mode: 'verify' })).toBe(false)
  })

  test('returns structural validity', () => {
    expect(Frame.validate(frame)).toBe(true)
    expect(Frame.validate({ ...frame, value: 1n })).toBe(false)
  })
})

describe('fromRpc', () => {
  test('maps budgets and preserves uint64 precision', () => {
    expect(
      Frame.fromRpc({
        data: '0xdeadbeef',
        executionGasLimit: '0x20000000000001',
        flags: 0,
        mode: 2,
        stateGasLimit: '0xc',
        target: null,
        value: '0x1',
      }),
    ).toEqual({
      data: '0xdeadbeef',
      executionGas: 9007199254740993n,
      flags: 0,
      mode: 2,
      stateGas: 12n,
      value: 1n,
    })
  })
})

describe('toRpc', () => {
  test('encodes defaults and named modes and flags', () => {
    expect(
      Frame.toRpc(
        Frame.from({ flags: 'approveExecutionAndPayment', mode: 'verify' }),
      ),
    ).toEqual({
      data: '0x',
      executionGasLimit: '0x0',
      flags: 3,
      mode: 1,
      stateGasLimit: '0x0',
      value: '0x0',
    })
  })
  test('accepts numberish budgets', () => {
    expect(
      Frame.toRpc({ executionGas: '0xc350', stateGas: 12, value: 0n }),
    ).toEqual({
      data: '0x',
      executionGasLimit: '0xc350',
      flags: 0,
      mode: 0,
      stateGasLimit: '0xc',
      value: '0x0',
    })
  })
})

test('maps to to the RPC target without changing tuple encoding', () => {
  const to = '0x1111111111111111111111111111111111111111'
  const frame = Frame.from({ to })
  const rpc = Frame.toRpc(frame)
  expect(rpc.target).toBe(to)
  expect(rpc).not.toHaveProperty('to')
  const decoded = Frame.fromRpc(rpc)
  expect(decoded.to).toBe(to)
  expect(decoded).not.toHaveProperty('target')
  expect(Frame.toTuple(frame)[2]).toBe(to)
  expect(Frame.fromTuple(Frame.toTuple(frame)).to).toBe(to)
})
