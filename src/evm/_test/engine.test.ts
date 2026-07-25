import { Hex } from 'ox'
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

  test('behavior: the stack limit is enforced at the block boundary', () => {
    // Bounds are validated once per block, not per instruction, so the limit
    // must still hold exactly at 1024 and fail at 1025.
    expect(run(`0x${'5f'.repeat(1024)}`).status).toBe(0)
    expect(run(`0x${'5f'.repeat(1025)}`).status).toBe(4) // stack-overflow
  })
})
