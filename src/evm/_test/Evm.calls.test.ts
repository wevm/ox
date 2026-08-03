import { Evm, State } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

// Expected gas figures are computed by hand from the fee schedule (annotated
// per test) — never derived from the implementation.

const self = '0x00000000000000000000000000000000000000aa' as const
const bob = '0x00000000000000000000000000000000000000b0' as const
const carol = '0x00000000000000000000000000000000000000c1' as const
const nobody = '0x00000000000000000000000000000000000000dd' as const

// Program tail: store the stack top at memory 0 and return the word.
const ret = '5f5260205ff3'
// PUSH20 <address>.
const push = (address: string) => `73${address.slice(2)}`
const designate = (address: string) => `0xef0100${address.slice(2)}` as const
// The five zero operands shared by every plain call: out and in windows plus
// value. STATICCALL/DELEGATECALL variants use four (no value).
const zeros = (n: number) => '5f'.repeat(n)

const word = (value: bigint | number | string) =>
  `0x${BigInt(value).toString(16).padStart(64, '0')}` as const

function returned(result: Evm.Result): `0x${string}` {
  Evm.assertSuccess(result)
  return result.output
}

describe('CALL', () => {
  test('zero-value call to a non-existent account: cold 2600, no surcharge, no account', () => {
    const state = State.fromMemory()
    // PUSH0 ×5 (10) + PUSH20 (3) + PUSH0 gas (2) + cold 2600 + tail 13.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(nobody)}5ff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(1))
    expect(result.gasUsed).toBe(2628n)
    expect(state.getAccount(nobody)).toBeUndefined()
  })

  test('second call to the same target is warm: 100', () => {
    const call = `${zeros(5)}${push(nobody)}5ff1`
    const result = Evm.run({
      address: self,
      bytecode: `0x${call}${call}${ret}`,
    })
    expect(returned(result)).toBe(word(1))
    // 15 + 2600 + 15 + 100 + 13.
    expect(result.gasUsed).toBe(2743n)
  })

  test('gas assembly: memory, access, and value charges all precede the 63/64 cap; stipend rides free', () => {
    const state = State.fromMemory({
      accounts: {
        [self]: { balance: 10n },
        // GAS at the first instruction, returned as a word.
        [bob]: { balance: 5n, code: `0x5a${ret}` },
      },
    })
    // PUSH1 32 outLen (3), PUSH0 ×3 (6), PUSH1 3 value (3), PUSH20 (3),
    // PUSH4 gas (3) = 18. CALL charges: out-window expansion 3, cold 2600,
    // value 9000. Remaining 200000 − 18 − 3 − 2600 − 9000 = 188379; the cap
    // retains ⌊188379/64⌋ = 2943, forwarding 185436, plus the 2300 stipend.
    // The child's GAS (static 2) then reads 185436 + 2300 − 2 = 187734.
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f6003${push(bob)}63fffffffff160205ff3`,
      gas: 200_000n,
      state,
    })
    expect(returned(result)).toBe(word(187_734))
    // Child used 15; parent tail (PUSH1 32, PUSH0, RETURN) 5.
    // 18 + 3 + 2600 + 9000 + 15 + 5.
    expect(result.gasUsed).toBe(9341n)
    expect(state.getAccount(self)?.balance).toBe(7n)
    expect(state.getAccount(bob)?.balance).toBe(8n)
  })

  test('value to a dead account: 25000 surcharge, account created on commit', () => {
    const state = State.fromMemory({
      accounts: { [self]: { balance: 10n } },
    })
    // PUSH0 ×4 (8) + PUSH1 3 (3) + PUSH20 (3) + PUSH0 gas (2) = 16.
    // CALL: cold 2600 + value 9000 + new account 25000 + tail 13. The child
    // hands back its untouched 2300 stipend, which the caller never paid —
    // a net gain (the classic 9000-charged, 6700-effective transfer).
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(4)}6003${push(nobody)}5ff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(1))
    expect(result.gasUsed).toBe(34_329n)
    expect(state.getAccount(nobody)?.balance).toBe(3n)
    expect(state.getAccount(nobody)?.nonce).toBe(0n)
    expect(state.getAccount(self)?.balance).toBe(7n)
  })

  test('value to an existing-but-empty account still pays 25000 (EIP-161 emptiness)', () => {
    const state = State.fromMemory({
      accounts: { [self]: { balance: 10n }, [bob]: {} },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(4)}6003${push(bob)}5ff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(1))
    expect(result.gasUsed).toBe(34_329n)
    expect(state.getAccount(bob)?.balance).toBe(3n)
  })

  test('insufficient balance: pushes 0, refunds the stipend, moves nothing', () => {
    const state = State.fromMemory({
      accounts: { [self]: { balance: 2n }, [bob]: { balance: 5n } },
    })
    // 16 + cold 2600 + value 9000 + tail 13; the failed call refunds its
    // full allowance — the never-paid 2300 stipend included.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(4)}6005${push(bob)}5ff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
    expect(result.gasUsed).toBe(9329n)
    expect(state.getAccount(self)?.balance).toBe(2n)
    expect(state.getAccount(bob)?.balance).toBe(5n)
  })

  test('self-call with value nets to zero', () => {
    const state = State.fromMemory({
      accounts: { [self]: { balance: 10n } },
    })
    // 16 + warm self (preamble) 100 + value 9000 + tail 13 − the returned
    // stipend 2300; no 25000 (self is not empty).
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(4)}6004${push(self)}5ff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(1))
    expect(result.gasUsed).toBe(6829n)
    expect(state.getAccount(self)?.balance).toBe(10n)
  })

  test('reverting child: writes and value roll back, revert data surfaces', () => {
    const state = State.fromMemory({
      accounts: {
        [self]: { balance: 10n },
        // SSTORE slot 1 ← 0x2a, then REVERT with the word 0x2a.
        [bob]: { balance: 5n, code: '0x602a600155602a5f5260205ffd' },
      },
    })
    // Out window [0, 32) receives the revert data; the success word is 0.
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f6003${push(bob)}63fffffffff160205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(0x2a))
    expect(state.getStorage(bob, 1n)).toBe(0n)
    expect(state.getAccount(self)?.balance).toBe(10n)
    expect(state.getAccount(bob)?.balance).toBe(5n)
  })

  test('reverting child pushes 0', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: '0x5f5ffd' } },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
  })

  test('halting child consumes its whole allowance and pushes 0', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: '0xfe' } },
    })
    // PUSH0 ×5 (10) + PUSH20 (3) + PUSH2 10000 (3) = 16; cold 2600; the
    // child burns all 10000; RETURNDATASIZE (2) reads 0; tail 13.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}612710f13d${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
    expect(result.gasUsed).toBe(12_631n)
  })

  test('output copy-back is bounded by what the child returned', () => {
    const state = State.fromMemory({
      // Returns 4 bytes: 0xdeadbeef.
      accounts: { [bob]: { code: '0x63deadbeef5f526004601cf3' } },
    })
    // Pre-fill memory[0..32) with ones, call with a 32-byte out window, and
    // return the word: only the first 4 bytes may be overwritten.
    const result = Evm.run({
      address: self,
      bytecode: `0x7f${'ff'.repeat(32)}5f5260205f5f5f5f${push(bob)}61fffff160205ff3`,
      state,
    })
    expect(returned(result)).toBe(`0xdeadbeef${'ff'.repeat(28)}`)
  })
})

describe('CALLCODE', () => {
  test('runs foreign code against the caller storage', () => {
    const state = State.fromMemory({
      // SSTORE slot 1 ← 0x2a.
      accounts: { [bob]: { code: '0x602a600155' } },
    })
    // 16 + cold 2600 + child (3 + 3 + 2100 + 20000) + tail 13.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff2${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(1))
    expect(result.gasUsed).toBe(24_735n)
    expect(state.getStorage(self, 1n)).toBe(42n)
    expect(state.getStorage(bob, 1n)).toBe(0n)
  })

  test('value sets CALLVALUE and the stipend but never moves', () => {
    const state = State.fromMemory({
      accounts: {
        [self]: { balance: 10n },
        [bob]: { balance: 5n, code: `0x34${ret}` },
      },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f6007${push(bob)}61fffff260205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(7))
    expect(state.getAccount(self)?.balance).toBe(10n)
    expect(state.getAccount(bob)?.balance).toBe(5n)
  })

  test('ADDRESS inside the child is the caller', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: `0x30${ret}` } },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f5f${push(bob)}61fffff260205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(self))
  })

  test('insufficient balance fails the call even though nothing would move', () => {
    const state = State.fromMemory({
      accounts: { [self]: { balance: 2n }, [bob]: { code: `0x34${ret}` } },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(4)}6007${push(bob)}61fffff2${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
  })
})

describe('DELEGATECALL', () => {
  test('preserves the caller', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: `0x33${ret}` } },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f${push(bob)}61fffff460205ff3`,
      caller: carol,
      state,
    })
    expect(returned(result)).toBe(word(carol))
  })

  test('preserves the value', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: `0x34${ret}` } },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f${push(bob)}61fffff460205ff3`,
      state,
      value: 5n,
    })
    expect(returned(result)).toBe(word(5))
  })

  test('writes storage to the caller; no value charges', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: '0x602a600155' } },
    })
    // PUSH0 ×4 (8) + PUSH20 (3) + PUSH2 (3) = 14 + cold 2600 +
    // child (3 + 3 + 2100 + 20000) + tail 13.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(4)}${push(bob)}61fffff4${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(1))
    expect(result.gasUsed).toBe(24_733n)
    expect(state.getStorage(self, 1n)).toBe(42n)
    expect(state.getStorage(bob, 1n)).toBe(0n)
  })
})

describe('STATICCALL', () => {
  test('child SSTORE halts with static-violation, consuming the allowance', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: '0x602a600155' } },
    })
    // PUSH0 ×4 (8) + PUSH20 (3) + PUSH2 10000 (3) = 14; cold 2600; the
    // child burns all 10000; RETURNDATASIZE (2) reads 0; tail 13.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(4)}${push(bob)}612710fa3d${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
    expect(result.gasUsed).toBe(12_629n)
    expect(state.getStorage(bob, 1n)).toBe(0n)
  })

  test('the child sees CALLVALUE 0', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: `0x34${ret}` } },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f${push(bob)}61fffffa60205ff3`,
      state,
      value: 5n,
    })
    expect(returned(result)).toBe(word(0))
  })

  test('staticness propagates through nested zero-value CALL', () => {
    const state = State.fromMemory({
      accounts: {
        // Calls carol and returns the success word.
        [bob]: { code: `0x${zeros(5)}${push(carol)}6103e8f1${ret}` },
        // LOG0 — a static violation when the context is static.
        [carol]: { code: '0x5f5fa0' },
      },
    })
    const viaStatic = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f${push(bob)}61fffffa60205ff3`,
      state,
    })
    expect(returned(viaStatic)).toBe(word(0))

    const viaCall = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f5f${push(bob)}61fffff160205ff3`,
      state,
    })
    expect(returned(viaCall)).toBe(word(1))
  })

  test('value-bearing CALL inside a static frame halts that frame', () => {
    const state = State.fromMemory({
      accounts: {
        [bob]: {
          balance: 5n,
          code: `0x${zeros(4)}6001${push(carol)}61fffff1${ret}`,
        },
      },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f${push(bob)}61fffffa60205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(0))
  })

  test('value-bearing CALLCODE inside a static frame is allowed', () => {
    const state = State.fromMemory({
      accounts: {
        [bob]: {
          balance: 5n,
          code: `0x${zeros(4)}6001${push(nobody)}61fffff2${ret}`,
        },
      },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x60205f5f5f${push(bob)}61fffffa60205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(1))
  })
})

describe('EIP-7702 delegation', () => {
  test.each([
    {
      expected: bob,
      name: 'CALL',
      opcode: 'f1',
      operands: `6020${zeros(4)}`,
    },
    {
      expected: self,
      name: 'CALLCODE',
      opcode: 'f2',
      operands: `6020${zeros(4)}`,
    },
    {
      expected: self,
      name: 'DELEGATECALL',
      opcode: 'f4',
      operands: `6020${zeros(3)}`,
    },
    {
      expected: bob,
      name: 'STATICCALL',
      opcode: 'fa',
      operands: `6020${zeros(3)}`,
    },
  ])('$name executes delegated code in its normal context', (options) => {
    const state = State.fromMemory({
      accounts: {
        [bob]: { code: designate(carol) },
        [carol]: { code: `0x30${ret}` },
      },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x${options.operands}${push(bob)}61ffff${options.opcode}60205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(options.expected))
  })

  test('charges and warms the delegation target separately', () => {
    const state = State.fromMemory({
      accounts: {
        [bob]: { code: designate(carol) },
        [carol]: { code: '0x00' },
      },
    })
    const call = `${zeros(5)}${push(bob)}5ff1`
    const result = Evm.run({
      address: self,
      bytecode: `0x${call}${call}${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(1))
    // First call: 15 + two cold reads. Second: 15 + two warm reads. Tail: 13.
    expect(result.gasUsed).toBe(5443n)
  })

  test('charges a warm read when an account delegates to itself', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: designate(bob) } },
    })
    const result = Evm.run({
      bytecode: `0x${zeros(5)}${push(bob)}5ff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
    // Operands 15 + cold authority 2600 + warm self-delegate 100 + tail 13.
    expect(result.gasUsed).toBe(2728n)
  })

  test('fetches the delegated account before its code', () => {
    const reads: string[] = []
    const source = State.from({
      async: false,
      getAccount(address) {
        reads.push(`account:${address}`)
        if (address === bob)
          return {
            balance: 0n,
            code: designate(carol),
            hasStorage: false,
            nonce: 0n,
          }
        if (address === carol)
          return { balance: 0n, hasStorage: false, nonce: 0n }
        return undefined
      },
      getBlockHash: () => `0x${'00'.repeat(32)}` as `0x${string}`,
      getCode(address) {
        reads.push(`code:${address}`)
        return address === carol ? '0x00' : '0x'
      },
      getStorage: () => 0n,
      putAccount() {},
      putStorage() {},
    })
    const result = Evm.run({
      bytecode: `0x${zeros(5)}${push(bob)}61fffff1${ret}`,
      state: source,
    })

    expect(returned(result)).toBe(word(1))
    expect(reads).toMatchInlineSnapshot(`
      [
        "account:0x00000000000000000000000000000000000000b0",
        "account:0x00000000000000000000000000000000000000c1",
        "code:0x00000000000000000000000000000000000000c1",
      ]
    `)
  })

  test('activates at Prague', () => {
    const state = State.fromMemory({
      accounts: {
        [bob]: { code: designate(carol) },
        [carol]: { code: '0x00' },
      },
    })
    const bytecode = `0x${zeros(5)}${push(bob)}61fffff1${ret}` as const
    expect(returned(Evm.run({ bytecode, hardfork: 'cancun', state }))).toBe(
      word(0),
    )
    expect(returned(Evm.run({ bytecode, hardfork: 'prague', state }))).toBe(
      word(1),
    )
  })

  test('requires a complete designator', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: '0xef0100' } },
    })
    const result = Evm.run({
      bytecode: `0x${zeros(5)}${push(bob)}5ff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
    expect(result.gasUsed).toBe(2628n)
  })

  test('follows only one delegation', () => {
    const state = State.fromMemory({
      accounts: {
        [bob]: { code: designate(carol) },
        [carol]: { code: designate(nobody) },
        [nobody]: { code: '0x00' },
      },
    })
    const result = Evm.run({
      bytecode: `0x${zeros(5)}${push(bob)}61fffff1${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
  })

  test('code-reading opcodes keep their specified views', () => {
    const state = State.fromMemory({
      accounts: {
        [bob]: { code: designate(carol) },
        // CODESIZE, then return it.
        [carol]: { code: `0x38${ret}` },
      },
    })
    const delegated = Evm.run({
      bytecode: `0x60205f5f5f5f${push(bob)}61fffff160205ff3`,
      state,
    })
    expect(returned(delegated)).toBe(word(7))

    const external = Evm.run({
      bytecode: `0x${push(bob)}3b${ret}`,
      state,
    })
    expect(returned(external)).toBe(word(23))
  })
})

describe('returndata', () => {
  test('RETURNDATASIZE starts at 0', () => {
    const result = Evm.run({ bytecode: `0x3d${ret}` })
    expect(returned(result)).toBe(word(0))
    expect(result.gasUsed).toBe(15n)
  })

  test('RETURNDATACOPY copies a completed call output', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: `0x602a${ret}` } },
    })
    // Call (out window empty), then copy the 32-byte returndata to memory 0
    // and return it. Copy: 3 static + 3 per word + 3 expansion.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff160205f5f3e60205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(0x2a))
    // 16 + 2600 + child 16 + copy (3+2+2+9) + return 5.
    expect(result.gasUsed).toBe(2653n)
  })

  test('RETURNDATACOPY past the end is a hard halt', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: `0x602a${ret}` } },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff160215f5f3e`,
      gas: 100_000n,
      state,
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "gasUsed": 100000n,
        "reason": "returndata-out-of-bounds",
        "status": "halted",
      }
    `)
  })

  test('a zero-length RETURNDATACOPY still bounds-checks its offset', () => {
    const state = State.fromMemory({
      accounts: { [bob]: { code: `0x602a${ret}` } },
    })
    // offset 33, length 0: 33 > 32 halts.
    const past = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff15f60215f3e${ret}`,
      gas: 100_000n,
      state,
    })
    expect(past.status).toBe('halted')
    // offset 32, length 0: at the boundary, allowed.
    const at = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff15f60205f3e${ret}`,
      state,
    })
    expect(returned(at)).toBe(word(1))
  })

  test('a reverting child sets returndata; a halting child clears it', () => {
    const state = State.fromMemory({
      accounts: {
        [bob]: { code: '0x602a5f5260205ffd' },
        [carol]: { code: '0xfe' },
      },
    })
    const reverted = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff13d${ret}`,
      state,
    })
    expect(returned(reverted)).toBe(word(32))

    const halted = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff1${zeros(5)}${push(carol)}6103e8f13d${ret}`,
      state,
    })
    expect(returned(halted)).toBe(word(0))
  })

  test('a call that never starts still replaces returndata', () => {
    const state = State.fromMemory({
      accounts: {
        [self]: { balance: 2n },
        [bob]: { code: `0x602a${ret}` },
      },
    })
    // First call fills returndata (32 bytes); the second fails its balance
    // check before a child exists, clearing it.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(bob)}61fffff1${zeros(4)}6005${push(bob)}5ff13d${ret}`,
      state,
    })
    expect(returned(result)).toBe(word(0))
  })

  test('a child starts with empty returndata', () => {
    const state = State.fromMemory({
      accounts: {
        // Returns its own RETURNDATASIZE.
        [bob]: { code: `0x3d${ret}` },
        [carol]: { code: `0x602a${ret}` },
      },
    })
    // Fill the parent returndata via carol, then call bob with a 32-byte out
    // window: bob must report 0.
    const result = Evm.run({
      address: self,
      bytecode: `0x${zeros(5)}${push(carol)}61fffff160205f5f5f5f${push(bob)}61fffff160205ff3`,
      state,
    })
    expect(returned(result)).toBe(word(0))
  })
})

describe('depth', () => {
  test('calls enter depth 1024; only calls from there are refused', () => {
    // Each frame bumps slot 0, then re-calls itself with all remaining gas.
    // Exactly 1025 frames run (semantic depths 0 through 1024): the deepest
    // frame's CALL fails fast with 0 and the frame itself still succeeds,
    // so every increment commits.
    const code = `0x60015f54015f55${zeros(5)}305af100` as const
    const state = State.fromMemory({
      accounts: { [self]: { code } },
    })
    const result = Evm.run({
      address: self,
      bytecode: code,
      // The 63/64 ladder plus ~324 gas per level needs a deep budget to
      // still hold ~90k gas at depth 1024.
      gas: 10n ** 12n,
      state,
    })
    Evm.assertSuccess(result)
    expect(state.getStorage(self, 0n)).toBe(1025n)
  })
})
