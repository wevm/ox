import { Hash, Hex, Secp256k1 } from 'ox'
import * as Opcode from '../Opcode.js'
// Relative, not `ox/evm/internal/load`: `internal/` is deliberately absent
// from the package exports map, so the subpath has no types.
import * as load_ from '../internal/load.js'
import { beforeAll, describe, expect, test } from 'vp/test'

// Tests against the engine's raw exports, for invariants the public API cannot
// observe — chiefly the final stack, which `Evm.run` only surfaces via
// returned data.

let engine: load_.Engine
let vm: number

beforeAll(async () => {
  engine = await load_.load()
  vm = engine.evm_new(0)
})

/** Runs bytecode and returns the final stack, top first. */
function run(bytecode: Hex.Hex, gas = 1_000_000n) {
  const code = Hex.toBytes(bytecode)
  load_.view(engine).set(code, engine.evm_code_ptr(vm))
  engine.evm_set_code(vm, code.length)
  const status = engine.evm_run(vm, 0, gas)
  const stack: bigint[] = []
  for (let i = 0; i < engine.evm_stack_size(vm); i++) {
    engine.evm_stack_peek(vm, i)
    const ptr = engine.evm_output_ptr(vm)
    stack.push(
      Hex.toBigInt(Hex.fromBytes(load_.view(engine).slice(ptr, ptr + 32))),
    )
  }
  return { status, stack }
}

describe('engine', () => {
  test('behavior: imports nothing', async () => {
    // One artifact instantiates identically in Node, Bun, Deno, and browsers
    // only while the module has no imports. A stray `memcpy` import would
    // break that, so the build asserts it too.
    const { wasmBase64 } = await import('../internal/evm.wasm.js')
    const binary = Uint8Array.from(Buffer.from(wasmBase64, 'base64'))
    expect(WebAssembly.Module.imports(new WebAssembly.Module(binary))).toEqual(
      [],
    )
  })

  test('behavior: a truncated PUSH immediate is right-zero-padded', () => {
    for (const [bytecode, expected] of [
      ['0x61ff', 0xff00n], // PUSH2, one byte available
      ['0x62ff', 0xff0000n], // PUSH3, one byte available
      ['0x67ff', 0xffn << 56n], // PUSH8, one byte available
      ['0x68ff', 0xffn << 64n], // PUSH9, one byte available
      ['0x7fff', 0xffn << 248n], // PUSH32, one byte available
      ['0x60', 0n], // PUSH1, no bytes available
      ['0x7f', 0n], // PUSH32, no bytes available
    ] as const) {
      expect({ bytecode, stack: run(bytecode).stack }).toEqual({
        bytecode,
        stack: [expected],
      })
    }
  })

  test('behavior: every PUSH width loads its immediate big-endian', () => {
    for (let size = 1; size <= 32; size++) {
      // A distinct value per byte catches limb-ordering and byte-swap errors.
      const bytes = Array.from({ length: size }, (_, i) => i + 1)
      const immediate = bytes
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      const expected = BigInt(`0x${immediate}`)
      const op = (0x5f + size).toString(16)
      expect({ size, stack: run(`0x${op}${immediate}`).stack }).toEqual({
        size,
        stack: [expected],
      })
    }
  })

  test('behavior: DUP and SWAP address the right slots', () => {
    // Stack from the bottom: 1, 2, 3. DUP3 copies the deepest.
    expect(run('0x600160026003 82'.replace(/ /g, '') as Hex.Hex).stack).toEqual(
      [1n, 3n, 2n, 1n],
    )
    // SWAP2 exchanges the top with the third item.
    expect(run('0x600160026003 91'.replace(/ /g, '') as Hex.Hex).stack).toEqual(
      [1n, 2n, 3n],
    )
  })

  test('behavior: a long program does not corrupt its own bytecode', () => {
    // `stack` is the first field of the engine's VM struct and `code` follows a
    // few fields later, so a stack pointer that drifts past its 1024 slots
    // rewrites the program mid-run. This is the direct oracle for that: reading
    // the code buffer back must yield exactly what was written.
    //
    // Comparing two runs of the same program does NOT catch it — the corruption
    // is deterministic, so both runs agree. Nor do short programs: the drift
    // has to exceed 1024 slots first, and block validation only runs on entry.
    //
    // The regression this pins: `POP` decremented the struct field instead of
    // the hoisted local, so the stack grew by one every iteration.
    const body = '60205f2050' // PUSH1 32, PUSH0, KECCAK256, POP — net zero
    const bytecode: Hex.Hex = `0x${body.repeat(3000)}00`
    const code = Hex.toBytes(bytecode)

    load_.view(engine).set(code, engine.evm_code_ptr(vm))
    engine.evm_set_code(vm, code.length)
    const status = engine.evm_run(vm, 0, 100_000_000n)
    expect(status).toBe(0)

    const ptr = engine.evm_code_ptr(vm)
    const after = load_.view(engine).slice(ptr, ptr + code.length)
    expect(Hex.fromBytes(after)).toBe(bytecode)

    // Net-zero body, so the stack must be empty and gas exact.
    expect(engine.evm_stack_size(vm)).toBe(0)
    expect(100_000_000n - engine.evm_gas_left(vm)).toBe(3000n * 43n + 3n)
  })

  test('behavior: the stack limit is enforced at the block boundary', () => {
    // Bounds are validated once per block, not per instruction, so the limit
    // must still hold exactly at 1024 and fail at 1025.
    expect(run(`0x${'5f'.repeat(1024)}`).status).toBe(0)
    expect(run(`0x${'5f'.repeat(1025)}`).status).toBe(4) // stack-overflow
  })
})

describe('ecrecover precompile', () => {
  // Assembled from named pieces rather than one hex blob: the CALL operand
  // order is easy to get wrong, and a wrong order silently returns zeroes.
  //
  //   CALLDATACOPY(dest=0, offset=0, length=128)
  //   CALL(gas, 0x01, value=0, argsOff=0, argsLen=128, retOff=128, retLen=32)
  //   POP; RETURN(offset=128, length=32)
  //
  // Operands are pushed in reverse, so the last push is the top of the stack.
  const caller = [
    '6080',
    '5f',
    '5f',
    '37', // CALLDATACOPY(0, 0, 128)
    '6020',
    '6080', // retLen=32, retOff=128
    '6080',
    '5f', // argsLen=128, argsOff=0
    '5f',
    '6001',
    '5a',
    'f1', // value=0, to=1, gas, CALL
    '50', // discard the success flag
    '6020',
    '6080',
    'f3', // RETURN(128, 32)
  ].join('') as string

  const contract = '0x00000000000000000000000000000000000000c0' as const
  const zeroWord = `0x${'00'.repeat(32)}`

  /** Runs the precompile through a CALL and returns the 32-byte result. */
  function recoverVia(input: Uint8Array): Hex.Hex {
    engine.evm_reset(vm)
    const stage = engine.evm_stage_ptr(vm)
    const code = Hex.toBytes(`0x${caller}`)

    load_.view(engine).set(Hex.toBytes(contract), stage)
    load_.view(engine).set(new Uint8Array(32), stage + 64)
    load_.view(engine).set(code, stage + 128)
    expect(engine.evm_put_account(vm, 0n, code.length)).toBe(0)

    load_.view(engine).set(Hex.toBytes(contract), stage)
    load_.view(engine).set(new Uint8Array(20), stage + 20)
    load_.view(engine).set(new Uint8Array(32), stage + 64)
    load_.view(engine).set(input, stage + 128)
    expect(engine.evm_execute(vm, input.length, 10_000_000n, 0)).toBe(0)
    const ptr = engine.evm_output_ptr(vm)
    return Hex.fromBytes(
      load_.view(engine).slice(ptr, ptr + engine.evm_output_len(vm)),
    )
  }

  test('behavior: matches ox Secp256k1 recovery', () => {
    for (let i = 1; i <= 6; i++) {
      const privateKey = Hex.fromNumber(BigInt(i) * 0x9e3779b97f4a7c15n, {
        size: 32,
      })
      const payload = Hash.keccak256(Hex.fromString(`ox-evm-ecrecover-${i}`))
      const signature = Secp256k1.sign({ payload, privateKey })
      const expected = Secp256k1.recoverAddress({ payload, signature })

      const input = new Uint8Array(128)
      input.set(Hex.toBytes(payload), 0)
      input[63] = 27 + signature.yParity
      input.set(
        Hex.toBytes(Hex.fromNumber(BigInt(signature.r), { size: 32 })),
        64,
      )
      input.set(
        Hex.toBytes(Hex.fromNumber(BigInt(signature.s), { size: 32 })),
        96,
      )

      expect({ i, got: recoverVia(input) }).toEqual({
        i,
        got: Hex.fromNumber(BigInt(expected), { size: 32 }),
      })
    }
  })

  test('behavior: an out-of-range recovery id recovers nothing', () => {
    const input = new Uint8Array(128)
    input.set(Hex.toBytes(Hash.keccak256(Hex.fromString('x'))), 0)
    input[63] = 29 // only 27 and 28 are valid
    input[95] = 1
    input[127] = 1
    // The precompile succeeds and returns no data, so the caller's output
    // window stays zero.
    expect(recoverVia(input)).toBe(zeroWord)
  })
})

/** The engine's fork id for Prague. */
const PRAGUE = 13

describe('bn254 precompiles', () => {
  // The generator of G1 and the generator of G2, in EIP-196/EIP-197 encoding.
  // G2's Fp2 coordinates put the coefficient of `u` first.
  const g1 = `${'00'.repeat(31)}01${'00'.repeat(31)}02`
  const g2 = [
    '198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2',
    '1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed',
    '090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b',
    '12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa',
  ].join('')

  /**
   * Calls a precompile through a CALL and returns the raw return window.
   *
   * The caller is assembled from named pieces because CALL's seven operands are
   * pushed in reverse and a wrong order silently returns zeroes.
   */
  function precompile(address: number, input: Uint8Array): Hex.Hex {
    const len = `61${input.length.toString(16).padStart(4, '0')}`
    const asm = [
      len,
      '5f',
      '5f',
      '37', // CALLDATACOPY(0, 0, len)
      '610100', // retLen = 256, generous
      len, // retOff = len
      len, // argsLen
      '5f', // argsOff = 0
      '5f', // value = 0
      `60${address.toString(16).padStart(2, '0')}`, // to
      '5a', // gas
      'f1', // CALL
      '50', // discard the success flag
      '610100',
      len,
      'f3', // RETURN(len, 256)
    ].join('')
    const bytecode = Hex.toBytes(`0x${asm}`)
    const contract = '0x00000000000000000000000000000000000000c0' as const

    engine.evm_reset(vm)
    // A reset returns the fork to Prague. Pinning it explicitly anyway: on an
    // older fork 0x06 and above are not precompiles at all but ordinary empty
    // accounts, so a call to one would succeed and return nothing.
    const stage = engine.evm_stage_ptr(vm)
    load_.view(engine).set(new Uint8Array(256), stage)
    engine.evm_set_context(vm, 1n, 1n, 30_000_000n, 0, 0, PRAGUE)
    load_.view(engine).set(Hex.toBytes(contract), stage)
    load_.view(engine).set(new Uint8Array(32), stage + 64)
    load_.view(engine).set(bytecode, stage + 128)
    expect(engine.evm_put_account(vm, 0n, bytecode.length)).toBe(0)

    load_.view(engine).set(Hex.toBytes(contract), stage)
    load_.view(engine).set(new Uint8Array(20), stage + 20)
    load_.view(engine).set(new Uint8Array(32), stage + 64)
    load_.view(engine).set(input, stage + 128)
    expect(engine.evm_execute(vm, input.length, 500_000_000n, 0)).toBe(0)
    const ptr = engine.evm_output_ptr(vm)
    return Hex.fromBytes(
      load_.view(engine).slice(ptr, ptr + engine.evm_output_len(vm)),
    )
  }

  test('behavior: ECADD doubles the generator', () => {
    // 2*G1 has a known value; adding G1 to itself must produce it.
    const got = precompile(0x06, Hex.toBytes(`0x${g1}${g1}`)).slice(0, 130)
    expect(got).toBe(
      '0x030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd3' +
        '15ed738c0e0a7c92e7845f96b2ae9c0a68a6a449e3538fc7ff3ebf7a5a18a2c4',
    )
  })

  test('behavior: ECMUL by two agrees with ECADD', () => {
    const two = `${'00'.repeat(31)}02`
    const mul = precompile(0x07, Hex.toBytes(`0x${g1}${two}`)).slice(0, 130)
    const add = precompile(0x06, Hex.toBytes(`0x${g1}${g1}`)).slice(0, 130)
    expect(mul).toBe(add)
  })

  test('behavior: ECMUL by the group order gives the point at infinity', () => {
    // The order encodes as all-zero output, which is how EIP-196 spells
    // infinity.
    const order =
      '30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001'
    expect(precompile(0x07, Hex.toBytes(`0x${g1}${order}`)).slice(0, 130)).toBe(
      `0x${'00'.repeat(64)}`,
    )
  })

  test('behavior: ECPAIRING is bilinear', () => {
    const negG1 =
      `${'00'.repeat(31)}01` +
      '30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd45'
    // e(G1, G2) * e(-G1, G2) == 1
    const paired = precompile(
      0x08,
      Hex.toBytes(`0x${g1}${g2}${negG1}${g2}`),
    ).slice(0, 66)
    expect(paired).toBe(`0x${'00'.repeat(31)}01`)
    // A single non-degenerate pairing is not one.
    expect(precompile(0x08, Hex.toBytes(`0x${g1}${g2}`)).slice(0, 66)).toBe(
      `0x${'00'.repeat(32)}`,
    )
  })

  test('behavior: an empty ECPAIRING input is the empty product', () => {
    expect(precompile(0x08, new Uint8Array(0)).slice(0, 66)).toBe(
      `0x${'00'.repeat(31)}01`,
    )
  })
})

describe('opcode pricing', () => {
  // An opcode absent from the engine's gas table is not merely free: the
  // analyzer treats it as unknown and ends the basic block there, so every
  // instruction after it in the block runs free too. ADDRESS, BALANCE, ORIGIN,
  // CALLER and CALLVALUE were all missing, which cost gas accuracy across whole
  // programs, not just those five instructions.
  //
  // This walks every opcode the engine claims to support and asserts it is
  // priced. It needs no per-opcode constants — the point is that the table has
  // an entry at all.
  const free = new Set([
    'STOP', // terminators legitimately cost nothing on their own
    'RETURN',
    'REVERT',
    'INVALID',
    'SELFDESTRUCT', // priced, but halts before the block can be observed
  ])

  test('behavior: every supported opcode carries a gas price', () => {
    const unpriced: string[] = []
    // The PUSH, DUP and SWAP families are not individual entries in
    // `Opcode.codes`, so walk every byte and take the ones that have a name.
    const all = Array.from({ length: 256 }, (_, i) => i).filter((i) =>
      Opcode.toName(i),
    )
    for (const op of all) {
      const name = Opcode.toName(op) as string
      if (free.has(name)) continue
      // Enough zeroes below it to satisfy any opcode's inputs, then the opcode,
      // then a POP so a pushing opcode does not end with a full stack. Running
      // off the end is a STOP, so no terminator is needed.
      const pushes = '5f'.repeat(8)
      const baseline: Hex.Hex = `0x${pushes}`
      const withOp: Hex.Hex = `0x${pushes}${op.toString(16).padStart(2, '0')}`
      const gas = (bytecode: Hex.Hex) => {
        const code = Hex.toBytes(bytecode)
        load_.view(engine).set(code, engine.evm_code_ptr(vm))
        engine.evm_set_code(vm, code.length)
        engine.evm_run(vm, 0, 100_000_000n)
        return 100_000_000n - engine.evm_gas_left(vm)
      }
      // Some opcodes halt on the zero operands they are handed; a halt consumes
      // everything, which is still evidence the opcode was priced.
      const before = gas(baseline)
      const after = gas(withOp)
      if (after <= before) unpriced.push(name)
    }
    expect(unpriced).toEqual([])
  })
})
