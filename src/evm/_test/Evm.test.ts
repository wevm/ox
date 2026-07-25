import { Hash, Hex } from 'ox'
import * as Evm from 'ox/evm/Evm'
import { describe, expect, test } from 'vp/test'

/** Assembles a `PUSH32` of `value`. */
function push(value: bigint): string {
  return `7f${value.toString(16).padStart(64, '0')}`
}

/** Wraps bytecode so the top of the stack is returned as 32 bytes. */
function ret(body: string): Hex.Hex {
  return `0x${body}5f5260205ff3`
}

/** Wraps bytecode so the top of the stack is reverted with as 32 bytes. */
function rev(body: string): Hex.Hex {
  return `0x${body}5f5260205ffd`
}

/** Runs `body` and decodes the returned word. */
async function evaluate(body: string): Promise<bigint> {
  const result = await Evm.run({ bytecode: ret(body) })
  expect(result.status).toBe('success')
  return Hex.toBigInt(result.data)
}

const maxUint256 = 2n ** 256n - 1n

describe('run', () => {
  test('behavior: adds', async () => {
    const { status, data, gasUsed } = await Evm.run({
      bytecode: '0x60016002015f5260205ff3',
    })
    expect({ status, data, gasUsed }).toMatchInlineSnapshot(`
      {
        "data": "0x0000000000000000000000000000000000000000000000000000000000000003",
        "gasUsed": 22n,
        "status": "success",
      }
    `)
  })

  test('behavior: reverts', async () => {
    const { status, data } = await Evm.run({
      bytecode: rev(push(0xdeadn)),
    })
    expect({ status, data }).toMatchInlineSnapshot(`
      {
        "data": "0x000000000000000000000000000000000000000000000000000000000000dead",
        "status": "reverted",
      }
    `)
  })

  test('behavior: reads calldata', async () => {
    const result = await Evm.run({
      // PUSH0, CALLDATALOAD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
      bytecode: '0x5f355f5260205ff3',
      data: '0x1122',
    })
    // Reads past the end of calldata are zero-padded on the right.
    expect(result.data).toMatchInlineSnapshot(
      `"0x1122000000000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('behavior: empty bytecode succeeds', async () => {
    expect(await Evm.run({ bytecode: '0x' })).toMatchInlineSnapshot(`
      {
        "data": "0x",
        "gasLeft": 30000000n,
        "gasUsed": 0n,
        "status": "success",
      }
    `)
  })

  test('behavior: running off the end halts as STOP', async () => {
    const { status, data } = await Evm.run({ bytecode: '0x6001' })
    expect({ status, data }).toEqual({ status: 'success', data: '0x' })
  })

  test('behavior: reuses cached analysis across identical bytecode', async () => {
    // The engine analyzes once per distinct bytecode. Re-running the same code,
    // then different code, then the same code again must not carry stale
    // analysis between them.
    const a = '0x60016002015f5260205ff3' as const
    const b = '0x60056006025f5260205ff3' as const
    const results = []
    for (const bytecode of [a, a, b, a, b, b])
      results.push((await Evm.run({ bytecode })).data)
    expect(results).toEqual([
      Hex.fromNumber(3n, { size: 32 }),
      Hex.fromNumber(3n, { size: 32 }),
      Hex.fromNumber(30n, { size: 32 }),
      Hex.fromNumber(3n, { size: 32 }),
      Hex.fromNumber(30n, { size: 32 }),
      Hex.fromNumber(30n, { size: 32 }),
    ])
  })

  test('behavior: a bytes input re-analyzes rather than reusing a stale key', async () => {
    // `Uint8Array` has no cheap identity, so it must never hit the cache.
    await Evm.run({ bytecode: '0x60016002015f5260205ff3' })
    const result = await Evm.run({
      bytecode: Hex.toBytes('0x60056006025f5260205ff3'),
    })
    expect(result.data).toBe(Hex.fromNumber(30n, { size: 32 }))
  })

  test('behavior: accepts bytes', async () => {
    const result = await Evm.run({
      bytecode: Hex.toBytes('0x60016002015f5260205ff3'),
    })
    expect(result.status).toBe('success')
  })

  describe('push', () => {
    test('behavior: every PUSH width round-trips', async () => {
      // PUSH1, PUSH2-8 (single limb), and PUSH9-32 take separate paths.
      for (let size = 1; size <= 32; size++) {
        const value = (1n << BigInt(size * 8 - 1)) | 0xabn
        const immediate = value.toString(16).padStart(size * 2, '0')
        const op = (0x5f + size).toString(16)
        expect({ size, value: await evaluate(`${op}${immediate}`) }).toEqual({
          size,
          value,
        })
      }
    })

    test('behavior: a truncated immediate still halts cleanly', async () => {
      // A truncated PUSH is necessarily the last instruction, so its value is
      // not observable through returned data — see the internal ABI test below
      // for that. What is observable is that it halts as STOP and is charged.
      for (const bytecode of [
        '0x61ff',
        '0x68ff',
        '0x7fff',
        '0x60',
        '0x7f',
      ] as const) {
        const result = await Evm.run({ bytecode, gas: 1000n })
        expect({
          bytecode,
          status: result.status,
          gasUsed: result.gasUsed,
        }).toEqual({ bytecode, status: 'success', gasUsed: 3n })
      }
    })

    test('behavior: PUSH0 pushes zero without reading code', async () => {
      expect(await evaluate('5f')).toBe(0n)
    })
  })

  describe('arithmetic', () => {
    test('behavior: wraps on overflow', async () => {
      expect(await evaluate(`${push(1n)}${push(maxUint256)}01`)).toBe(0n)
      expect(await evaluate(`${push(1n)}5f03`)).toBe(maxUint256)
      expect(await evaluate(`${push(2n)}${push(maxUint256)}02`)).toBe(
        (maxUint256 * 2n) & maxUint256,
      )
    })

    test('behavior: division and modulus by zero yield zero', async () => {
      expect(await evaluate(`5f${push(5n)}04`)).toBe(0n)
      expect(await evaluate(`5f${push(5n)}06`)).toBe(0n)
      expect(await evaluate(`5f${push(5n)}05`)).toBe(0n)
      expect(await evaluate(`5f${push(5n)}07`)).toBe(0n)
    })

    test('behavior: divides multi-limb values', async () => {
      const a =
        0xdeadbeefcafebabe1234567890abcdefdeadbeefcafebabe1234567890abcdefn
      const b = 0x0123456789abcdef0123456789abcdefn
      expect(await evaluate(`${push(b)}${push(a)}04`)).toBe(a / b)
      expect(await evaluate(`${push(b)}${push(a)}06`)).toBe(a % b)
    })

    test('behavior: signed division truncates toward zero', async () => {
      expect(await evaluate(`${push(2n)}${push(-6n & maxUint256)}05`)).toBe(
        -3n & maxUint256,
      )
      expect(await evaluate(`${push(3n)}${push(-7n & maxUint256)}07`)).toBe(
        -1n & maxUint256,
      )
    })

    test('behavior: addmod computes at 257 bits', async () => {
      expect(
        await evaluate(`${push(7n)}${push(maxUint256)}${push(maxUint256)}08`),
      ).toBe((maxUint256 + maxUint256) % 7n)
    })

    test('behavior: mulmod computes at 512 bits', async () => {
      const m = 0xfffffffffffffffdn
      expect(
        await evaluate(`${push(m)}${push(maxUint256)}${push(maxUint256)}09`),
      ).toBe((maxUint256 * maxUint256) % m)
    })

    test('behavior: exponentiates', async () => {
      expect(await evaluate(`${push(200n)}${push(3n)}0a`)).toBe(
        (3n ** 200n) & maxUint256,
      )
      expect(await evaluate(`5f${push(5n)}0a`)).toBe(1n)
    })

    test('behavior: sign-extends', async () => {
      expect(await evaluate(`60ff5f0b`)).toBe(maxUint256)
      expect(await evaluate(`607f5f0b`)).toBe(0x7fn)
    })
  })

  describe('bitwise', () => {
    test('behavior: shifts', async () => {
      expect(await evaluate(`${push(1n)}${push(255n)}1b`)).toBe(1n << 255n)
      expect(await evaluate(`${push(1n)}${push(256n)}1b`)).toBe(0n)
      expect(await evaluate(`${push(-16n & maxUint256)}${push(2n)}1d`)).toBe(
        -4n & maxUint256,
      )
      expect(await evaluate(`${push(-1n & maxUint256)}${push(300n)}1d`)).toBe(
        maxUint256,
      )
    })

    test('behavior: compares signed values', async () => {
      expect(await evaluate(`${push(1n)}${push(-1n & maxUint256)}12`)).toBe(1n)
      expect(await evaluate(`${push(1n)}${push(-1n & maxUint256)}13`)).toBe(0n)
    })

    test('behavior: extracts bytes', async () => {
      expect(await evaluate(`${push(0x1122334455n)}601f1a`)).toBe(0x55n)
      expect(await evaluate(`${push(0x1122334455n)}60201a`)).toBe(0n)
    })
  })

  describe('keccak256', () => {
    test('behavior: hashes a single block', async () => {
      // MSTORE8 'a','b','c' then KECCAK256(0, 3)
      const body = '6061 5f53 6062 600153 6063 600253 6003 5f20'.replace(
        / /g,
        '',
      )
      expect(Hex.fromNumber(await evaluate(body), { size: 32 })).toBe(
        Hash.keccak256(Hex.fromString('abc')),
      )
    })

    test('behavior: hashes across the rate boundary', async () => {
      // 200 bytes exceeds keccak's 136-byte rate, exercising the sponge loop.
      const bytes = new Uint8Array(200).map((_, i) => i & 0xff)
      let body = ''
      for (let i = 0; i < bytes.length; i++) {
        const offset = i === 0 ? '5f' : `60${i.toString(16).padStart(2, '0')}`
        body += `60${bytes[i]!.toString(16).padStart(2, '0')}${offset}53`
      }
      body += '60c85f20'
      expect(Hex.fromNumber(await evaluate(body), { size: 32 })).toBe(
        Hash.keccak256(Hex.fromBytes(bytes)),
      )
    })
  })

  describe('control flow', () => {
    test('behavior: loops with JUMPI', async () => {
      // PUSH1 5; JUMPDEST; PUSH1 1; SWAP1; SUB; DUP1; PUSH1 2; JUMPI
      expect(
        await evaluate('60055b60019003806002575f5260205ff3'.slice(0, 22)),
      ).toBe(0n)
    })

    test('error: jumping to a non-JUMPDEST', async () => {
      expect((await Evm.run({ bytecode: '0x600156' })).status).toBe(
        'invalid-jump',
      )
    })

    test('behavior: a JUMPDEST inside PUSH data is not a valid target', async () => {
      // PUSH1 0x5b (the 0x5b is immediate data, not an instruction), JUMP
      expect((await Evm.run({ bytecode: '0x605b600156' })).status).toBe(
        'invalid-jump',
      )
    })
  })

  describe('halting', () => {
    test('error: undefined opcode', async () => {
      expect((await Evm.run({ bytecode: '0x0c' })).status).toBe(
        'invalid-opcode',
      )
    })

    test('error: stack underflow', async () => {
      expect((await Evm.run({ bytecode: '0x01' })).status).toBe(
        'stack-underflow',
      )
    })

    test('error: stack overflow', async () => {
      // 1025 pushes exceeds the 1024-slot limit.
      expect(
        (await Evm.run({ bytecode: `0x${'5f'.repeat(1025)}` })).status,
      ).toBe('stack-overflow')
    })

    test('error: bytecode larger than the engine buffer', async () => {
      // Guarded in TS: writing this into linear memory would overrun the
      // engine's fixed `code` field and corrupt the fields after it.
      await expect(
        Evm.run({ bytecode: `0x${'00'.repeat(100_000)}` }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Evm.SizeOverflowError: bytecode cannot exceed \`49152\` bytes. Given size: \`100000\` bytes.]`,
      )
    })

    test('error: calldata larger than the engine buffer', async () => {
      await expect(
        Evm.run({ bytecode: '0x', data: `0x${'00'.repeat(2_000_000)}` }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Evm.SizeOverflowError: data cannot exceed \`1048576\` bytes. Given size: \`2000000\` bytes.]`,
      )
    })

    test('behavior: bytecode at the buffer limit still runs', async () => {
      // Boundary check: exactly at capacity must be accepted, not rejected.
      const result = await Evm.run({ bytecode: `0x${'00'.repeat(49_152)}` })
      expect(result.status).toBe('success')
    })

    test('behavior: an exceptional halt consumes all gas', async () => {
      // Unlike REVERT, an exceptional halt returns nothing to the caller.
      for (const bytecode of [
        '0x01', // stack underflow
        '0x0c', // undefined opcode
        '0x600156', // jump to a non-JUMPDEST
      ] as const) {
        const result = await Evm.run({ bytecode, gas: 50_000n })
        expect({ bytecode, gasLeft: result.gasLeft }).toEqual({
          bytecode,
          gasLeft: 0n,
        })
      }
    })

    test('behavior: REVERT returns unspent gas', async () => {
      const { status, gasLeft } = await Evm.run({
        bytecode: '0x5f5ffd',
        gas: 50_000n,
      })
      expect({ status, gasLeft }).toEqual({
        status: 'reverted',
        gasLeft: 49_996n,
      })
    })

    test('error: out of gas', async () => {
      const result = await Evm.run({ bytecode: '0x6001600201', gas: 5n })
      expect(result).toMatchInlineSnapshot(`
        {
          "data": "0x",
          "gasLeft": 0n,
          "gasUsed": 5n,
          "status": "out-of-gas",
        }
      `)
    })
  })

  describe('gas', () => {
    test('behavior: charges per opcode', async () => {
      // PUSH1(3) + PUSH1(3) + ADD(3)
      const { gasUsed } = await Evm.run({
        bytecode: '0x6001600201',
        gas: 1000n,
      })
      expect(gasUsed).toBe(9n)
    })

    test('behavior: charges memory expansion quadratically', async () => {
      // MSTORE at a high offset costs far more than the 3 gas base.
      const { gasUsed } = await Evm.run({
        bytecode: `0x5f${push(0x10000n)}52`,
        gas: 10_000_000n,
      })
      // PUSH0(2) + PUSH32(3) + MSTORE(3), then expansion to cover [0x10000, +32).
      const words = BigInt(Math.ceil((0x10000 + 32) / 32))
      expect(gasUsed).toBe(2n + 3n + 3n + (3n * words + (words * words) / 512n))
    })

    test('behavior: EXP charges per exponent byte', async () => {
      // 10 base + 50 per byte of exponent; 0x0100 is two bytes.
      const { gasUsed } = await Evm.run({
        bytecode: `0x${push(0x0100n)}${push(2n)}0a`,
        gas: 1000n,
      })
      expect(gasUsed).toBe(3n + 3n + 10n + 100n)
    })
  })
})

describe('call', () => {
  test('behavior: returns data', async () => {
    expect(await Evm.call({ bytecode: '0x60016002015f5260205ff3' })).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000003',
    )
  })

  test('error: reverts', async () => {
    await expect(
      Evm.call({ bytecode: '0x5f5ffd' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Evm.RevertedError: Execution reverted.]`,
    )
  })

  test('error: halts', async () => {
    await expect(
      Evm.call({ bytecode: '0x01' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Evm.ExecutionError: Execution halted: stack-underflow.]`,
    )
  })
})

describe('ready', () => {
  test('behavior: idempotent', async () => {
    await Evm.ready()
    await Evm.ready()
    expect((await Evm.run({ bytecode: '0x' })).status).toBe('success')
  })
})
