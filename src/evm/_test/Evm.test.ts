import { Evm, State } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

test('exports', () => {
  expect(Object.keys(Evm)).toMatchInlineSnapshot(`
    [
      "from",
      "call",
      "run",
      "assertSuccess",
      "RevertedError",
      "HaltedError",
    ]
  `)
})

describe('from', () => {
  test('default', () => {
    const state = State.fromMemory()
    const evm = Evm.from({ state })

    expect(evm.hardfork).toBe('osaka')
    expect(evm.state).toBe(state)
  })

  test('error: unknown hardfork', () => {
    expect(() =>
      Evm.from({
        // @ts-expect-error
        hardfork: 'verkle',
        state: State.fromMemory(),
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hardfork.UnknownHardforkError: Unknown hardfork \`verkle\`.

      Known hardforks: cancun, prague, osaka.]
    `)
  })
})

describe('call', () => {
  const from = '0x00000000000000000000000000000000000000f0'
  const to = '0x00000000000000000000000000000000000000c0'

  test('default', () => {
    const evm = Evm.from({
      state: State.fromMemory({
        accounts: {
          // CALLER, ORIGIN, CALLVALUE, and CALLDATALOAD(0), returned as words.
          [from]: { balance: 100n },
          [to]: { code: '0x335f5232602052346040525f3560605260805ff3' },
        },
      }),
    })
    const result = Evm.call(evm, {
      data: '0xdeadbeef',
      from,
      to,
      value: 42n,
    })

    Evm.assertSuccess(result)
    expect(result.output).toMatchInlineSnapshot(
      `"0x00000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000000f0000000000000000000000000000000000000000000000000000000000000002adeadbeef00000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('discards state changes', () => {
    const state = State.fromMemory({
      accounts: {
        // SSTORE(1, 42), then return SLOAD(1).
        [to]: { code: '0x602a6001556001545f5260205ff3' },
      },
    })
    const result = Evm.call(Evm.from({ state }), { to })

    Evm.assertSuccess(result)
    expect(result.output).toBe(
      '0x000000000000000000000000000000000000000000000000000000000000002a',
    )
    expect(state.getStorage(to, 1n)).toBe(0n)
  })

  test('applies value ephemerally', () => {
    const state = State.fromMemory({
      accounts: {
        [from]: { balance: 100n },
        // SELFBALANCE, return the word.
        [to]: { balance: 5n, code: '0x475f5260205ff3' },
      },
    })
    const result = Evm.call(Evm.from({ state }), { from, to, value: 42n })

    Evm.assertSuccess(result)
    expect(result.output).toBe(
      '0x000000000000000000000000000000000000000000000000000000000000002f',
    )
    expect(state.getAccount(from)?.balance).toBe(100n)
    expect(state.getAccount(to)?.balance).toBe(5n)
  })

  test('halts when value exceeds the sender balance', () => {
    const evm = Evm.from({
      state: State.fromMemory({
        accounts: { [from]: { balance: 41n }, [to]: {} },
      }),
    })

    expect(Evm.call(evm, { from, gas: 100n, to, value: 42n }))
      .toMatchInlineSnapshot(`
        {
          "gasUsed": 100n,
          "reason": "insufficient-balance",
          "status": "halted",
        }
      `)
  })

  test('executes delegated code in the authority context', () => {
    const delegate = '0x00000000000000000000000000000000000000d0'
    const evm = Evm.from({
      state: State.fromMemory({
        accounts: {
          [delegate]: { code: '0x305f5260205ff3' },
          [to]: { code: `0xef0100${delegate.slice(2)}` },
        },
      }),
    })
    const result = Evm.call(evm, { to })

    Evm.assertSuccess(result)
    expect(result.output).toBe(
      '0x00000000000000000000000000000000000000000000000000000000000000c0',
    )
  })

  test('warms the delegation target', () => {
    const delegate = '0x00000000000000000000000000000000000000d0'
    const evm = Evm.from({
      state: State.fromMemory({
        accounts: {
          // PUSH20 delegate, BALANCE, POP, STOP.
          [delegate]: { code: `0x73${delegate.slice(2)}315000` },
          [to]: { code: `0xef0100${delegate.slice(2)}` },
        },
      }),
    })

    expect(Evm.call(evm, { to })).toMatchInlineSnapshot(`
      {
        "gasRefund": 0n,
        "gasUsed": 2705n,
        "logs": [],
        "output": "0x",
        "status": "success",
      }
    `)
  })

  test('does not follow delegations before Prague', () => {
    const delegate = '0x00000000000000000000000000000000000000d0'
    const evm = Evm.from({
      hardfork: 'cancun',
      state: State.fromMemory({
        accounts: {
          [delegate]: { code: '0x00' },
          [to]: { code: `0xef0100${delegate.slice(2)}` },
        },
      }),
    })

    expect(Evm.call(evm, { gas: 100n, to })).toMatchInlineSnapshot(`
      {
        "gasUsed": 100n,
        "reason": "invalid-opcode",
        "status": "halted",
      }
    `)
  })
})

describe('run', () => {
  test('default', () => {
    // PUSH1 1, PUSH1 2, ADD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
    expect(Evm.run({ bytecode: '0x60016002015f5260205ff3' }))
      .toMatchInlineSnapshot(`
        {
          "gasRefund": 0n,
          "gasUsed": 22n,
          "logs": [],
          "output": "0x0000000000000000000000000000000000000000000000000000000000000003",
          "status": "success",
        }
      `)
  })

  test('behavior: empty bytecode is an implicit STOP', () => {
    expect(Evm.run({ bytecode: '0x' })).toMatchInlineSnapshot(`
      {
        "gasRefund": 0n,
        "gasUsed": 0n,
        "logs": [],
        "output": "0x",
        "status": "success",
      }
    `)
  })

  test('behavior: running off the end of code is an implicit STOP', () => {
    // PUSH1 1 — no terminator.
    const result = Evm.run({ bytecode: '0x6001' })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasRefund": 0n,
        "gasUsed": 3n,
        "logs": [],
        "output": "0x",
        "status": "success",
      }
    `)
  })

  test('behavior: revert returns data and unspent gas', () => {
    // PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, REVERT
    const result = Evm.run({ bytecode: '0x602a5f5260205ffd', gas: 100n })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasUsed": 16n,
        "output": "0x000000000000000000000000000000000000000000000000000000000000002a",
        "status": "reverted",
      }
    `)
  })

  test('behavior: exceptional halts consume all gas', () => {
    // ADD on an empty stack.
    expect(Evm.run({ bytecode: '0x01', gas: 1000n })).toMatchInlineSnapshot(`
      {
        "gasUsed": 1000n,
        "reason": "stack-underflow",
        "status": "halted",
      }
    `)

    // Undefined opcode.
    expect(Evm.run({ bytecode: '0x0c', gas: 1000n }).status).toBe('halted')

    // INVALID.
    const invalid = Evm.run({ bytecode: '0xfe', gas: 1000n })
    expect(invalid).toMatchInlineSnapshot(`
      {
        "gasUsed": 1000n,
        "reason": "invalid-opcode",
        "status": "halted",
      }
    `)

    // Jump to a destination that is PUSH data, not a JUMPDEST.
    // PUSH1 3, JUMP — offset 3 is inside nothing; 0x5b at offset 3 is absent.
    const jump = Evm.run({ bytecode: '0x600356', gas: 1000n })
    expect(jump).toMatchInlineSnapshot(`
      {
        "gasUsed": 1000n,
        "reason": "invalid-jump",
        "status": "halted",
      }
    `)

    // Out of gas: KECCAK256 over 32 bytes costs 44 with expansion.
    const oog = Evm.run({ bytecode: '0x60205f2050', gas: 10n })
    expect(oog).toMatchInlineSnapshot(`
      {
        "gasUsed": 10n,
        "reason": "out-of-gas",
        "status": "halted",
      }
    `)
  })

  test('behavior: jump to a JUMPDEST inside PUSH data is invalid', () => {
    // PUSH1 0x5b (the 0x5b is data), PUSH1 1, JUMP — destination 1 holds 0x5b
    // but it is a PUSH immediate.
    const result = Evm.run({ bytecode: '0x605b600156', gas: 1000n })
    expect(result.status).toBe('halted')
  })

  test('behavior: valid JUMP and JUMPI', () => {
    // PUSH1 4, JUMP, INVALID, JUMPDEST, STOP
    expect(Evm.run({ bytecode: '0x600456fe5b00' }).status).toBe('success')

    // PUSH1 1 (condition), PUSH1 6, JUMPI, INVALID, JUMPDEST, STOP
    expect(Evm.run({ bytecode: '0x6001600657fe5b00' }).status).toBe('success')

    // Zero condition falls through to INVALID.
    expect(Evm.run({ bytecode: '0x5f600657fe5b00' }).status).toBe('halted')
  })

  test('behavior: re-analyzes a mutated bytecode buffer', () => {
    // PUSH1 4, JUMP, INVALID, JUMPDEST, STOP
    const bytecode = new Uint8Array([0x60, 0x04, 0x56, 0xfe, 0x5b, 0x00])
    expect(Evm.run({ bytecode, gas: 1000n }).status).toBe('success')

    // Overwriting the JUMPDEST invalidates the jump; the jumpdests analyzed for
    // the previous contents must not be reused for this run.
    bytecode[4] = 0x00
    expect(Evm.run({ bytecode, gas: 1000n })).toMatchInlineSnapshot(`
      {
        "gasUsed": 1000n,
        "reason": "invalid-jump",
        "status": "halted",
      }
    `)
  })

  test('behavior: PC, MSIZE, GAS', () => {
    // PC at offset 0.
    const pc = Evm.run({ bytecode: '0x585f5260205ff3' })
    Evm.assertSuccess(pc)
    expect(pc.output).toMatchInlineSnapshot(
      `"0x0000000000000000000000000000000000000000000000000000000000000000"`,
    )

    // MSIZE after MSTORE at 0 is 32.
    const msize = Evm.run({ bytecode: '0x5f5f52595f5260205ff3' })
    Evm.assertSuccess(msize)
    expect(msize.output).toMatchInlineSnapshot(
      `"0x0000000000000000000000000000000000000000000000000000000000000020"`,
    )

    // GAS pushes the remaining gas after its own charge.
    const gas = Evm.run({ bytecode: '0x5a5f5260205ff3', gas: 100n })
    Evm.assertSuccess(gas)
    expect(gas.output).toMatchInlineSnapshot(
      `"0x0000000000000000000000000000000000000000000000000000000000000062"`,
    )
  })

  test('behavior: calldata opcodes', () => {
    // CALLDATASIZE
    const size = Evm.run({ bytecode: '0x365f5260205ff3', data: '0xdeadbeef' })
    Evm.assertSuccess(size)
    expect(size.output).toMatchInlineSnapshot(
      `"0x0000000000000000000000000000000000000000000000000000000000000004"`,
    )

    // CALLDATALOAD at 0 zero-pads past the end.
    const load = Evm.run({ bytecode: '0x5f355f5260205ff3', data: '0xdeadbeef' })
    Evm.assertSuccess(load)
    expect(load.output).toMatchInlineSnapshot(
      `"0xdeadbeef00000000000000000000000000000000000000000000000000000000"`,
    )

    // CALLDATACOPY.
    const copy = Evm.run({
      bytecode: '0x60045f5f375f515f5260205ff3',
      data: '0xdeadbeef',
    })
    Evm.assertSuccess(copy)
    expect(copy.output).toMatchInlineSnapshot(
      `"0xdeadbeef00000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('behavior: MCOPY', () => {
    // PUSH1 42, PUSH0, MSTORE, PUSH1 32 (len), PUSH0 (src), PUSH1 32 (dst),
    // MCOPY, PUSH1 32, MLOAD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
    const result = Evm.run({
      bytecode: '0x602a5f5260205f60205e6020515f5260205ff3',
    })
    Evm.assertSuccess(result)
    expect(result.output).toMatchInlineSnapshot(
      `"0x000000000000000000000000000000000000000000000000000000000000002a"`,
    )
  })

  test('behavior: CLZ is Osaka-only', () => {
    // PUSH1 1, CLZ, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN — CLZ(1) = 255.
    const bytecode = '0x60011e5f5260205ff3'
    const osaka = Evm.run({ bytecode, hardfork: 'osaka' })
    Evm.assertSuccess(osaka)
    expect(osaka.output).toMatchInlineSnapshot(
      `"0x00000000000000000000000000000000000000000000000000000000000000ff"`,
    )

    expect(Evm.run({ bytecode, hardfork: 'prague' })).toMatchInlineSnapshot(`
      {
        "gasUsed": 30000000n,
        "reason": "invalid-opcode",
        "status": "halted",
      }
    `)
  })

  test('behavior: truncated PUSH immediate is right-zero-padded', () => {
    // PUSH2 with one data byte.
    const result = Evm.run({ bytecode: '0x61ff' })
    expect(result.status).toBe('success')
  })

  test('behavior: stack overflow', () => {
    // 1025 PUSH0s.
    const result = Evm.run({ bytecode: `0x${'5f'.repeat(1025)}`, gas: 10_000n })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasUsed": 10000n,
        "reason": "stack-overflow",
        "status": "halted",
      }
    `)
  })

  test('behavior: zero-length RETURN with a huge offset does not expand', () => {
    // PUSH0 (len), PUSH32 2^256-1 (offset), RETURN
    const result = Evm.run({
      bytecode: `0x5f7f${'ff'.repeat(32)}f3`,
      gas: 100n,
    })
    Evm.assertSuccess(result)
    expect(result.output).toBe('0x')
  })

  test('error: unknown hardfork', () => {
    expect(() =>
      // @ts-expect-error
      Evm.run({ bytecode: '0x00', hardfork: 'verkle' }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hardfork.UnknownHardforkError: Unknown hardfork \`verkle\`.

      Known hardforks: cancun, prague, osaka.]
    `)
  })
})

describe('assertSuccess', () => {
  test('default', () => {
    const result = Evm.run({ bytecode: '0x60016002015f5260205ff3' })
    Evm.assertSuccess(result)
    expect(result.output).toBeDefined()
  })

  test('error: reverted', () => {
    // PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, REVERT
    const result = Evm.run({ bytecode: '0x602a5f5260205ffd' })
    expect(() => Evm.assertSuccess(result)).toThrowErrorMatchingInlineSnapshot(`
        [Evm.RevertedError: Execution reverted.

        Data: 0x000000000000000000000000000000000000000000000000000000000000002a]
      `)
  })

  test('error: reverted with no data', () => {
    const result = Evm.run({ bytecode: '0x5f5ffd' })
    expect(() => Evm.assertSuccess(result)).toThrowErrorMatchingInlineSnapshot(
      '[Evm.RevertedError: Execution reverted.]',
    )
  })

  test('error: halted', () => {
    const result = Evm.run({ bytecode: '0xfe' })
    expect(() => Evm.assertSuccess(result)).toThrowErrorMatchingInlineSnapshot(
      '[Evm.HaltedError: Execution halted: invalid-opcode.]',
    )
  })
})
