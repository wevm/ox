import { Hash, Hex, Secp256k1 } from 'ox'
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
      input.set(Hex.toBytes(Hex.fromNumber(signature.r, { size: 32 })), 64)
      input.set(Hex.toBytes(Hex.fromNumber(signature.s, { size: 32 })), 96)

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
