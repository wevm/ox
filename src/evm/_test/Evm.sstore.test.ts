import { Evm, State } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

// The EIP-2200/2929/3529 SSTORE matrix, as exact program totals. Slot 1
// starts cold in every run; `original` comes from the seeded state.
//
// Program shape: (PUSH value, PUSH1 slot, SSTORE)+ — PUSH0 costs 2, PUSH1
// costs 3, and the slot push is always PUSH1 (3).

const address = '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357' as const

function sstore(
  writes: readonly bigint[],
  options: { original?: bigint; gas?: bigint } = {},
) {
  const { original = 0n } = options
  const state = State.fromMemory({
    accounts: {
      [address]: {
        storage:
          original === 0n
            ? {}
            : { '0x01': `0x${original.toString(16)}` as const },
      },
    },
  })
  let bytecode = '0x'
  let pushGas = 0n
  for (const value of writes) {
    bytecode += value === 0n ? '5f' : `60${value.toString(16).padStart(2, '0')}`
    pushGas += value === 0n ? 2n : 3n
    bytecode += '600155'
    pushGas += 3n
  }
  const result = Evm.run({
    address,
    bytecode: bytecode as `0x${string}`,
    ...(options.gas !== undefined ? { gas: options.gas } : {}),
    state,
  })
  return { pushGas, result, state }
}

function expectGas(
  writes: readonly bigint[],
  options: { original?: bigint },
  sstoreGas: bigint,
  refund: bigint,
) {
  const { pushGas, result } = sstore(writes, options)
  Evm.assertSuccess(result)
  expect(result.gasUsed, 'gasUsed').toBe(pushGas + sstoreGas)
  expect(result.gasRefund, 'gasRefund').toBe(refund)
}

describe('single write to a cold slot (current == original)', () => {
  test('0 → 0: warm-access 100 + cold 2100', () => {
    expectGas([0n], { original: 0n }, 2200n, 0n)
  })

  test('0 → X: set 20000 + cold 2100', () => {
    expectGas([0x2an], { original: 0n }, 22_100n, 0n)
  })

  test('X → X: warm-access 100 + cold 2100', () => {
    expectGas([0x2an], { original: 0x2an }, 2200n, 0n)
  })

  test('X → 0: reset 2900 + cold 2100, clears refund 4800', () => {
    expectGas([0n], { original: 0x2an }, 5000n, 4800n)
  })

  test('X → Y: reset 2900 + cold 2100', () => {
    expectGas([0x07n], { original: 0x2an }, 5000n, 0n)
  })
})

describe('dirty second write (current != original, slot warm)', () => {
  test('0 → X → 0: restores original zero, refund 19900', () => {
    expectGas([0x2an, 0n], { original: 0n }, 22_100n + 100n, 19_900n)
  })

  test('0 → X → Y: dirty write costs 100', () => {
    expectGas([0x2an, 0x07n], { original: 0n }, 22_100n + 100n, 0n)
  })

  test('X → 0 → X: clear refund granted then unwound, restore refund 2800', () => {
    expectGas([0n, 0x2an], { original: 0x2an }, 5000n + 100n, 2800n)
  })

  test('X → Y → 0: clearing from a dirty non-zero, refund 4800', () => {
    expectGas([0x07n, 0n], { original: 0x2an }, 5000n + 100n, 4800n)
  })

  test('X → Y → Z: dirty write costs 100', () => {
    expectGas([0x07n, 0x09n], { original: 0x2an }, 5000n + 100n, 0n)
  })

  test('X → Y → X: restore to non-zero original, refund 2800', () => {
    expectGas([0x07n, 0x2an], { original: 0x2an }, 5000n + 100n, 2800n)
  })
})

describe('rules around the write', () => {
  test('sentry: leaves no headroom for the stipend', () => {
    // Pushes cost 5; SSTORE entered with exactly 2300 left must fail...
    const { result } = sstore([0n], { gas: 2305n })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasUsed": 2305n,
        "reason": "out-of-gas",
        "status": "halted",
      }
    `)
    // ...and with 2301 left must proceed.
    const { result: ok } = sstore([0n], { gas: 2306n })
    expect(ok.status).toBe('success')
  })

  test('static context: SSTORE halts with static-violation', () => {
    const state = State.fromMemory()
    const result = Evm.run({
      address,
      bytecode: '0x5f600155',
      state,
      static: true,
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasUsed": 30000000n,
        "reason": "static-violation",
        "status": "halted",
      }
    `)
  })

  test('successful runs commit storage to the source; identical writes are elided', () => {
    const { result, state } = sstore([0x2an], { original: 0n })
    Evm.assertSuccess(result)
    expect(state.getStorage(address, 1n)).toBe(0x2an)
  })

  test('SLOAD: cold 2100, warm 100', () => {
    const state = State.fromMemory({
      accounts: { [address]: { storage: { '0x01': '0x2a' } } },
    })
    // PUSH1 1, SLOAD, POP — cold; PUSH1 1, SLOAD — warm.
    const result = Evm.run({
      address,
      bytecode: '0x60015450600154',
      state,
    })
    Evm.assertSuccess(result)
    // 3 + 2100 + 2 + 3 + 100
    expect(result.gasUsed).toBe(2208n)
  })
})
