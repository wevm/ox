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

describe('reset isolation', () => {
  const sender = '0x00000000000000000000000000000000000000aa' as const

  /** Loads a sender with `nonce` and runs a create of `initcode`. */
  function create(initcode: Hex.Hex, withStorage: string[]) {
    engine.evm_reset(vm)
    const stage = engine.evm_stage_ptr(vm)
    const put = (addr: string, balance: bigint, nonce: bigint) => {
      load_.view(engine).set(Hex.toBytes(addr as Hex.Hex), stage)
      load_.view(engine).set(new Uint8Array(32), stage + 64)
      const buf = new Uint8Array(32)
      for (let i = 31, v = balance; i >= 0; i--, v >>= 8n)
        buf[i] = Number(v & 0xffn)
      load_.view(engine).set(buf, stage + 64)
      expect(engine.evm_put_account(vm, nonce, 0)).toBe(0)
    }
    // Accounts that hold storage but no code. These are what dirty the account
    // table for whatever runs next.
    for (const addr of withStorage) {
      put(addr, 0n, 0n)
      load_.view(engine).set(Hex.toBytes(addr as Hex.Hex), stage)
      load_.view(engine).set(new Uint8Array(32), stage + 64)
      const one = new Uint8Array(32)
      one[31] = 1
      load_.view(engine).set(one, stage + 96)
      expect(engine.evm_put_storage(vm)).toBe(0)
    }
    put(sender, 10n ** 18n, 1n)

    const init = Hex.toBytes(initcode)
    load_.view(engine).set(new Uint8Array(20), stage)
    load_.view(engine).set(Hex.toBytes(sender), stage + 20)
    load_.view(engine).set(new Uint8Array(32), stage + 64)
    load_.view(engine).set(init, stage + 128)
    const rc = engine.evm_execute_create(vm, init.length, 1_000_000n)
    return { rc, gas: 1_000_000n - engine.evm_gas_left(vm) }
  }

  test('behavior: a create is unaffected by the previous run’s state', () => {
    // PUSH1 1, PUSH1 0, MSTORE8, PUSH1 1, PUSH1 0, RETURN — deploys one byte.
    const initcode: Hex.Hex = '0x600160005360016000f3'

    // A run that leaves several storage-bearing accounts in the table first.
    // Account slots are recycled by index, so whatever runs next inherits them.
    const dirty = create(
      initcode,
      Array.from(
        { length: 6 },
        (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`,
      ),
    )
    expect(dirty.rc).toBe(0)

    // `evm_reset` clears the table, so a create with no storage anywhere must
    // succeed and cost the same as it would in a fresh process. It did not:
    // `account_intern` left the EIP-7610 storage flag from the recycled entry
    // set, so the new address looked occupied and the create consumed all of its
    // gas.
    const clean = create(initcode, [])
    expect(clean.rc).toBe(0)
    expect(clean.gas).toBeLessThan(1_000_000n)
    expect(clean).toEqual(dirty)
  })
})

describe('BLS12-381 precompiles', () => {
  // The generators, in EIP-2537 encoding: each Fp coordinate is 64 bytes with
  // 16 leading zeroes, and an Fp2 element puts its real part first — the
  // opposite of EIP-197's convention for bn254.
  const pad = (h: string) => `${'00'.repeat(16)}${h}`
  const g1 =
    pad(
      '17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb',
    ) +
    pad(
      '08b3f481e3aaa0f1a09e30ed741d8ae4fcf5e095d5d00af600db18cb2c04b3edd03cc744a2888ae40caa232946c5e7e1',
    )
  const g2 = [
    '024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8',
    '13e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e',
    '0ce5d527727d6e118cc9cdc6da2e351aadfd9baa8cbdd3a76d429a695160d12c923ac9cc3baca289e193548608b82801',
    '0606c4a02ea734cc32acd2b02bc28b99cb3e287e85a763af267492ab572e99ab3f370d275cec1da1aaa9075ff05f79be',
  ]
    .map(pad)
    .join('')
  const infG1 = '00'.repeat(128)
  const scalarTwo = `${'00'.repeat(31)}02`

  test('behavior: G1ADD doubling agrees with G1MSM by two', () => {
    const add = precompile(0x0b, Hex.toBytes(`0x${g1}${g1}`)).slice(0, 258)
    const msm = precompile(0x0c, Hex.toBytes(`0x${g1}${scalarTwo}`)).slice(
      0,
      258,
    )
    expect(add).not.toBe(`0x${infG1}`)
    expect(msm).toBe(add)
  })

  test('behavior: G1MSM by the group order gives infinity', () => {
    const order =
      '73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001'
    expect(precompile(0x0c, Hex.toBytes(`0x${g1}${order}`)).slice(0, 258)).toBe(
      `0x${infG1}`,
    )
  })

  test('behavior: G2ADD doubling agrees with G2MSM by two', () => {
    const add = precompile(0x0d, Hex.toBytes(`0x${g2}${g2}`)).slice(0, 514)
    const msm = precompile(0x0e, Hex.toBytes(`0x${g2}${scalarTwo}`)).slice(
      0,
      514,
    )
    expect(msm).toBe(add)
  })

  test('behavior: the pairing check is bilinear', () => {
    // -G1 has the same x and the negated y.
    const negG1 =
      pad(
        '17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb',
      ) +
      pad(
        '114d1d6855d545a8aa7d76c8cf2e21f267816aef1db507c96655b9d5caac42364e6f38ba0ecb751bad54dcd6b939c2ca',
      )
    // e(G1, G2) * e(-G1, G2) == 1
    expect(
      precompile(0x0f, Hex.toBytes(`0x${g1}${g2}${negG1}${g2}`)).slice(0, 66),
    ).toBe(`0x${'00'.repeat(31)}01`)
    // A single non-degenerate pairing is not one.
    expect(precompile(0x0f, Hex.toBytes(`0x${g1}${g2}`)).slice(0, 66)).toBe(
      `0x${'00'.repeat(32)}`,
    )
  })

  test('behavior: a coordinate at or above the modulus is rejected', () => {
    // The call fails, so the caller sees zeroes in its return window rather
    // than a point.
    const p =
      '1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab'
    const bad = pad(p) + pad('00'.repeat(48))
    expect(precompile(0x0b, Hex.toBytes(`0x${bad}${g1}`)).slice(0, 258)).toBe(
      `0x${infG1}`,
    )
  })
})

describe('fork availability', () => {
  // An opcode is rejected below the fork that introduced it. The engine's table
  // is a switch, and several opcodes share a case label with an older one —
  // CREATE with CREATE2, CALL with DELEGATECALL and STATICCALL — so a guard
  // written on the label rather than the opcode silently backdates the older
  // one. That is exactly what happened to CREATE.
  //
  // This states the introductions independently of the engine and checks both
  // directions: rejected one fork below, accepted at the fork itself.
  const introduced: [name: string, op: string, spec: number][] = [
    ['DELEGATECALL', 'f4', 1],
    ['RETURNDATASIZE', '3d', 4],
    ['REVERT', 'fd', 4],
    ['STATICCALL', 'fa', 4],
    ['SHL', '1b', 5],
    ['EXTCODEHASH', '3f', 5],
    ['CREATE2', 'f5', 5],
    ['CHAINID', '46', 7],
    ['SELFBALANCE', '47', 7],
    ['BASEFEE', '48', 9],
    ['PUSH0', '5f', 11],
    ['TLOAD', '5c', 12],
    ['MCOPY', '5e', 12],
    ['BLOBHASH', '49', 12],
    ['BLOBBASEFEE', '4a', 12],
  ]

  // Opcodes that have been there since Frontier and must work at spec 0. CREATE
  // and CALL are the ones that share a label with a later arrival.
  const frontier: [name: string, op: string][] = [
    ['CREATE', 'f0'],
    ['CALL', 'f1'],
    ['CALLCODE', 'f2'],
    ['RETURN', 'f3'],
    ['SELFDESTRUCT', 'ff'],
    ['DIFFICULTY', '44'],
    ['GAS', '5a'],
  ]

  /** Runs one opcode under `spec`, with enough zeroes below it for any inputs. */
  function statusAt(op: string, spec: number) {
    engine.evm_reset(vm)
    const stage = engine.evm_stage_ptr(vm)
    load_.view(engine).set(new Uint8Array(256), stage)
    engine.evm_set_context(vm, 1n, 1n, 30_000_000n, 0, 0, spec)
    // PUSH0 is itself fork-gated, so the operands are PUSH1 0.
    const code = Hex.toBytes(`0x${'6000'.repeat(8)}${op}`)
    load_.view(engine).set(code, engine.evm_code_ptr(vm))
    engine.evm_set_code(vm, code.length)
    return engine.evm_run(vm, 0, 10_000_000n)
  }

  const INVALID_OPCODE = 5

  test('behavior: an opcode is invalid below the fork that introduced it', () => {
    const wrong: string[] = []
    for (const [name, op, spec] of introduced) {
      if (statusAt(op, spec - 1) !== INVALID_OPCODE) wrong.push(`${name} early`)
      if (statusAt(op, spec) === INVALID_OPCODE) wrong.push(`${name} late`)
    }
    expect(wrong).toEqual([])
  })

  test('behavior: Frontier opcodes work at Frontier', () => {
    const wrong: string[] = []
    for (const [name, op] of frontier)
      if (statusAt(op, 0) === INVALID_OPCODE) wrong.push(name)
    expect(wrong).toEqual([])
  })
})

describe('keccak256', () => {
  // The permutation stores some lanes complemented, which is invisible from
  // outside — absorbing is a XOR and so transparent, and only the initial state
  // and the squeezed lanes are converted. Nothing about that is obvious from
  // reading it, so these are known answers checked against `ox`'s own
  // implementation, which is itself checked against `@noble/hashes`.
  const cases = [
    '',
    'a',
    'abc',
    'The quick brown fox jumps over the lazy dog',
    // One byte under, exactly on, and one over the 136-byte rate, so the
    // padding and the multi-block path both get exercised.
    'x'.repeat(135),
    'x'.repeat(136),
    'x'.repeat(137),
    'y'.repeat(400),
  ]

  test('behavior: matches ox Hash.keccak256 across the rate boundary', () => {
    for (const text of cases) {
      // Earlier tests leave the fork wherever they set it; a reset restores it.
      engine.evm_reset(vm)
      const bytes = Hex.toBytes(Hex.fromString(text))
      // PUSH2 len, PUSH0, KECCAK256, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN,
      // with the input arriving as calldata copied to memory first.
      const len = bytes.length.toString(16).padStart(4, '0')
      const bytecode: Hex.Hex = `0x61${len}5f5f3761${len}5f205f5260205ff3`
      const code = Hex.toBytes(bytecode)
      load_.view(engine).set(code, engine.evm_code_ptr(vm))
      engine.evm_set_code(vm, code.length)
      load_.view(engine).set(bytes, engine.evm_input_ptr(vm))
      expect(engine.evm_run(vm, bytes.length, 10_000_000n)).toBe(0)
      const ptr = engine.evm_output_ptr(vm)
      const got = Hex.fromBytes(load_.view(engine).slice(ptr, ptr + 32))
      expect({ text: text.slice(0, 12), got }).toEqual({
        text: text.slice(0, 12),
        got: Hash.keccak256(Hex.fromString(text)),
      })
    }
  })
})

describe('block gas accounting', () => {
  // Gas and stack bounds are validated once per basic block, and a JUMPDEST
  // starts a block. The interpreter also enters the first block on entry, so
  // code beginning with a JUMPDEST — which most compiled output does — had that
  // block charged twice. It was one gas per such program plus the rest of the
  // block, and it cost more than half a point of conformance.
  test('behavior: a leading JUMPDEST is charged once', () => {
    const run = (bytecode: Hex.Hex) => {
      engine.evm_reset(vm)
      const code = Hex.toBytes(bytecode)
      load_.view(engine).set(code, engine.evm_code_ptr(vm))
      engine.evm_set_code(vm, code.length)
      expect(engine.evm_run(vm, 0, 1_000_000n)).toBe(0)
      return 1_000_000n - engine.evm_gas_left(vm)
    }
    // JUMPDEST alone is 1.
    expect(run('0x5b')).toBe(1n)
    // JUMPDEST, PUSH1, POP: 1 + 3 + 2.
    expect(run('0x5b600050')).toBe(6n)
    // The same block reached by a jump rather than by falling into it must cost
    // the same, which is what makes the leading case an accounting error rather
    // than a definition.
    // PUSH1 3, JUMP, JUMPDEST, PUSH1 0, POP = 3 + 8 + 1 + 3 + 2.
    expect(run('0x6003565b600050')).toBe(17n)
  })
})

describe('memory', () => {
  // MLOAD, MSTORE and MSTORE8 each bounded their offset by the *calldata*
  // limit. The guard is only there to stop `offset + 32` wrapping, so the
  // limit should be the addressable range; as written, a store two megabytes
  // up — affordable, legal, and what `msizeFiller` does — halted out of gas.
  test('behavior: memory reaches past the calldata limit', () => {
    for (const [offset, expected] of [
      [0x0fffffn, 0x100000n],
      [0x1fffffn, 0x200000n],
      [0xb00000n, 0xb00020n], // the offset `msizeFiller.yml::farChunk` uses
    ] as const) {
      engine.evm_reset(vm)
      // PUSH1 1, PUSH3 offset, MSTORE8, MSIZE
      const bytecode =
        `0x600162${offset.toString(16).padStart(6, '0')}5359` as const
      const code = Hex.toBytes(bytecode)
      load_.view(engine).set(code, engine.evm_code_ptr(vm))
      engine.evm_set_code(vm, code.length)
      expect({
        offset,
        status: engine.evm_run(vm, 0, 100_000_000_000n),
      }).toEqual({ offset, status: 0 })
      engine.evm_stack_peek(vm, 0)
      const ptr = engine.evm_output_ptr(vm)
      expect({
        offset,
        msize: Hex.toBigInt(
          Hex.fromBytes(load_.view(engine).slice(ptr, ptr + 32)),
        ),
      }).toEqual({ offset, msize: expected })
    }
  })
})

describe('EIP-2200 sentry', () => {
  // An SSTORE with no more than the 2300-gas call stipend left fails outright,
  // whatever it would have cost. It exists so a transfer callback cannot write
  // storage, and the check has to see the gas *before* the charge — which,
  // with static gas charged a block at a time, is not the interpreter's `gas`.
  //
  // Two writes to the same slot: the first sets (22100), the second is a no-op
  // (100). Without the sentry the second is affordable well below the stipend,
  // so the boundary below is entirely the sentry's doing.
  test('behavior: SSTORE fails at or below the stipend', () => {
    const run = (gas: bigint) => {
      engine.evm_reset(vm)
      const code = Hex.toBytes('0x600160015560016001550000')
      load_.view(engine).set(code, engine.evm_code_ptr(vm))
      engine.evm_set_code(vm, code.length)
      const status = engine.evm_run(vm, 0, gas)
      return { status, used: gas - engine.evm_gas_left(vm) }
    }
    // 12 static + 22100 + 100 = 22212, so the second SSTORE begins with
    // `gas - 22112` left. The sentry trips at 2300 of that, i.e. 24412.
    expect(run(24_412n)).toEqual({ status: 2, used: 24_412n }) // out of gas
    expect(run(24_413n)).toEqual({ status: 0, used: 22_212n })
  })
})
