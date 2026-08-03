import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import { Evm, State } from 'ox/evm'
import { describe, expect } from 'vp/test'

import * as oracle from '../../../test/evm/oracle.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

// Differential fuzz over the call family: random programs mixing raw opcodes
// with well-formed CALL/CALLCODE/DELEGATECALL/STATICCALL templates, executed
// against runnable peer accounts on both the TS interpreter and the WASM
// engine. Peers carry generated programs of their own — including call
// templates back into the pool, so frames nest and recurse — and every
// address sits outside the precompile range, which the TS core does not
// implement yet. Status class, gas, refund, output, logs, and post-state
// must all agree.
//
// Programs are assembled from chunks whose PUSH immediates are part of the
// chunk, so instruction boundaries are exact by construction: a call opcode
// only ever executes with the operands its own template pushed.

const self = '0x00000000000000000000000000000000000000aa'
const peers = [
  '0x00000000000000000000000000000000000000b1',
  '0x00000000000000000000000000000000000000b2',
] as const
const caller = '0x00000000000000000000000000000000000000c0'

// Single-byte opcodes safe to interleave freely (no immediates). Raw
// RETURNDATACOPY runs with arbitrary stack operands — usually an
// out-of-bounds hard halt, which both engines must classify identically.
const rawOps = [
  ...Array.from({ length: 0x1e }, (_, i) => i + 0x01), // arithmetic – CLZ
  0x20,
  0x30,
  0x31,
  0x32,
  0x33,
  0x34,
  0x35,
  0x36,
  0x37,
  0x38,
  0x39,
  0x3a,
  0x3b,
  0x3c,
  0x3d,
  0x3e,
  0x3f,
  0x40,
  0x41,
  0x42,
  0x43,
  0x44,
  0x45,
  0x46,
  0x47,
  0x48,
  0x49,
  0x4a,
  0x50,
  0x51,
  0x52,
  0x53,
  0x54,
  0x55,
  0x56,
  0x57,
  0x58,
  0x59,
  0x5a,
  0x5b,
  0x5c,
  0x5d,
  0x5e,
  0x5f,
  ...Array.from({ length: 32 }, (_, i) => i + 0x80), // DUP1 – SWAP16
  0xa0,
  0xa1,
  0xa2,
  0xa3,
  0xa4,
  0x00,
  0xf3,
  0xfd,
  0xfe,
  0xff,
]

// Call targets, pushed as PUSH1 (addresses left-pad): the executing account,
// both peers, and a never-staged address for the dead-account paths.
const targets = [0xaa, 0xb1, 0xb2, 0xdd]

// PUSH snippets for the gas operand: nothing, a trickle, a mid allowance,
// and far more than the 63/64 cap will grant.
const gasPushes = [
  [0x5f],
  [0x60, 0x40],
  [0x61, 0x4e, 0x20],
  [0x63, 0xff, 0xff, 0xff, 0xff],
]

// PUSH snippets for the value operand: zero, small (usually funded), and
// beyond any staged balance (the balance-check failure path).
const valuePushes = [
  [0x5f],
  [0x60, 0x01],
  [0x6c, ...Array.from({ length: 13 }, () => 0xff)],
]

const arbitraryCallChunk = () =>
  fc
    .record({
      gas: fc.constantFrom(...gasPushes),
      opcode: fc.constantFrom(0xf1, 0xf2, 0xf4, 0xfa),
      target: fc.constantFrom(...targets),
      value: fc.constantFrom(...valuePushes),
      windows: fc.array(fc.constantFrom(0, 32, 64), {
        maxLength: 4,
        minLength: 4,
      }),
    })
    .map(({ gas, opcode, target, value, windows }) => [
      // outLen, outOff, inLen, inOff — then value, target, gas.
      ...windows.flatMap((size) => [0x60, size]),
      ...(opcode === 0xf1 || opcode === 0xf2 ? value : []),
      0x60,
      target,
      ...gas,
      opcode,
    ])

const arbitraryChunk = () =>
  fc.oneof(
    { weight: 5, arbitrary: fc.constantFrom(...rawOps).map((op) => [op]) },
    {
      weight: 2,
      arbitrary: fc
        .tuple(fc.constant(0x60), fc.integer({ min: 0, max: 255 }))
        .map(([push, byte]) => [push, byte]),
    },
    { weight: 2, arbitrary: arbitraryCallChunk() },
    {
      // RETURNDATACOPY with small controlled operands — in range often
      // enough to exercise the copy itself, not just the halt.
      weight: 1,
      arbitrary: fc
        .record({
          length: fc.constantFrom(0, 1, 32, 64),
          offset: fc.constantFrom(0, 1, 32),
        })
        .map(({ length, offset }) => [0x60, length, 0x60, offset, 0x5f, 0x3e]),
    },
  )

const arbitraryProgram = (maxChunks: number) =>
  fc
    .array(arbitraryChunk(), { maxLength: maxChunks, minLength: 0 })
    .map((chunks) => new Uint8Array(chunks.flat()))

const arbitraryAccount = () =>
  fc.record({
    balance: fc.bigInt({ min: 0n, max: 2n ** 96n }),
    nonce: fc.bigInt({ min: 0n, max: 100n }),
  })

const arbitraryStorage = () =>
  fc.array(
    fc.record({
      slot: fc.bigInt({ min: 0n, max: 4n }),
      value: fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }),
    }),
    { maxLength: 6 },
  )

const block = {
  baseFee: 7n,
  blobBaseFee: 3n,
  chainId: 1n,
  coinbase: '0x00000000000000000000000000000000000000fe',
  gasLimit: 30_000_000n,
  number: 10n,
  prevRandao: 0xabcdefn,
  timestamp: 1000n,
}
const chainHashes = [0x9999n, 0x8888n, 0x7777n]

function compare(options: {
  program: Uint8Array
  peerPrograms: Uint8Array[]
  data: Uint8Array
  gas: bigint
  accounts: { balance: bigint; nonce: bigint }[]
  storage: { slot: bigint; value: bigint }[]
  static?: boolean
}) {
  const accounts = [
    {
      address: self,
      balance: options.accounts[0]?.balance ?? 0n,
      code: options.program,
      nonce: 1n,
    },
    ...peers.map((address, i) => ({
      address,
      balance: options.accounts[i + 1]?.balance ?? 0n,
      code: options.peerPrograms[i] ?? new Uint8Array(0),
      nonce: options.accounts[i + 1]?.nonce ?? 0n,
    })),
  ]
  const storage = options.storage.map((entry) => ({ address: self, ...entry }))

  const expected = oracle.execute({
    accounts,
    address: self,
    block,
    caller,
    chainHashes,
    data: options.data,
    gas: options.gas,
    gasPrice: 9n,
    static: options.static ?? false,
    storage,
    value: 5n,
  })

  const state = State.fromMemory({
    accounts: Object.fromEntries(
      accounts.map((account) => [
        account.address,
        {
          balance: account.balance,
          code: Hex.fromBytes(account.code),
          nonce: account.nonce,
        },
      ]),
    ),
    blockHashes: Object.fromEntries(
      chainHashes.map((hash, i) => [
        Number(block.number) - 1 - i,
        Hex.fromNumber(hash, { size: 32 }),
      ]),
    ),
  })
  for (const entry of storage) state.putStorage(self, entry.slot, entry.value)

  const actual = Evm.run({
    address: self,
    block: {
      baseFeePerGas: block.baseFee,
      blobBaseFee: block.blobBaseFee,
      coinbase: block.coinbase as `0x${string}`,
      gasLimit: block.gasLimit,
      number: block.number,
      prevRandao: Hex.fromNumber(block.prevRandao, { size: 32 }),
      timestamp: block.timestamp,
    },
    bytecode: options.program,
    caller,
    chainId: block.chainId,
    data: options.data,
    gas: options.gas,
    gasPrice: 9n,
    state,
    static: options.static ?? false,
    value: 5n,
  })

  const statusClass = actual.status === 'halted' ? 'exceptional' : actual.status
  expect(statusClass, `status (oracle: ${expected.status})`).toBe(
    expected.statusClass,
  )
  expect(actual.gasUsed, `gasUsed (oracle: ${expected.status})`).toBe(
    expected.gasUsed,
  )
  if (actual.status === 'halted') return

  expect(actual.output).toBe(Hex.fromBytes(expected.output))
  if (actual.status !== 'success') return

  expect(actual.gasRefund, 'refund').toBe(expected.refund)
  expect(
    actual.logs.map((log) => ({
      address: log.address.toLowerCase(),
      data: log.data,
      topics: log.topics,
    })),
    'logs',
  ).toEqual(
    expected.logs.map((log) => ({
      address: log.address,
      data: Hex.fromBytes(log.data),
      topics: log.topics.map((topic) => Hex.fromNumber(topic, { size: 32 })),
    })),
  )

  // Post-state: every account and slot the engine reports must match the
  // committed TS source.
  for (const [address, account] of expected.accounts) {
    const actualAccount = state.getAccount(address as `0x${string}`)
    expect(actualAccount?.balance ?? 0n, `balance of ${address}`).toBe(
      account.balance,
    )
    expect(actualAccount?.nonce ?? 0n, `nonce of ${address}`).toBe(
      account.nonce,
    )
  }
  for (const [address, slots] of expected.storage)
    for (const [slot, value] of slots)
      expect(
        state.getStorage(address as `0x${string}`, slot),
        `storage ${address}[${slot}]`,
      ).toBe(value)
}

describe('TS interpreter matches the WASM engine over calls', () => {
  test.prop(
    {
      accounts: fc.array(arbitraryAccount(), { minLength: 3, maxLength: 3 }),
      data: fc.uint8Array({ maxLength: 32 }),
      gas: fc.constantFrom(60_000n, 300_000n, 1_000_000n),
      peerPrograms: fc.array(arbitraryProgram(10), {
        minLength: 2,
        maxLength: 2,
      }),
      program: arbitraryProgram(24),
      storage: arbitraryStorage(),
    },
    { numRuns },
  )('call programs over runnable peers agree', (options) => {
    compare(options)
  })

  test.prop(
    {
      accounts: fc.array(arbitraryAccount(), { minLength: 3, maxLength: 3 }),
      data: fc.uint8Array({ maxLength: 16 }),
      gas: fc.constantFrom(300_000n),
      peerPrograms: fc.array(arbitraryProgram(10), {
        minLength: 2,
        maxLength: 2,
      }),
      program: arbitraryProgram(24),
      storage: arbitraryStorage(),
    },
    { numRuns },
  )('static contexts agree', (options) => {
    compare({ ...options, static: true })
  })
})
