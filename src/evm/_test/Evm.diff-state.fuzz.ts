import { fc, test } from '@fast-check/vitest'
import { Hex } from 'ox'
import { Evm, EvmState } from 'ox/evm'
import { describe, expect } from 'vp/test'

import * as oracle from '../../../test/evm/oracle.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

// Stateful differential fuzz: random programs over the state, environment,
// storage, log, and selfdestruct opcodes, executed against random pre-state
// on both the TS interpreter and the WASM engine. Status class, gas, refund,
// output, logs, and the post-state must all agree.

const self = '0x00000000000000000000000000000000000000aa'
const peers = [
  '0x0000000000000000000000000000000000000001',
  '0x0000000000000000000000000000000000000002',
  '0x00000000000000000000000000000000000000c0',
] as const

const word = () => fc.bigInt({ min: 0n, max: 2n ** 256n - 1n })

const arbitraryProgram = () =>
  fc
    .array(
      fc.oneof(
        // Arithmetic through CLZ; PUSH/DUP/SWAP.
        fc.integer({ min: 0x01, max: 0x1e }),
        fc.integer({ min: 0x5f, max: 0x9f }),
        // Memory, flow, keccak, calldata/code, terminators.
        fc.constantFrom(
          0x00,
          0x20,
          0x35,
          0x36,
          0x37,
          0x38,
          0x39,
          0x50,
          0x51,
          0x52,
          0x53,
          0x56,
          0x57,
          0x58,
          0x59,
          0x5a,
          0x5b,
          0x5e,
          0xf3,
          0xfd,
          0xfe,
        ),
        // Environment and block context.
        fc.constantFrom(
          0x30,
          0x31,
          0x32,
          0x33,
          0x34,
          0x3a,
          0x3b,
          0x3c,
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
        ),
        // Storage, transient storage, logs — weighted up: this is the
        // surface M2 exists for.
        fc.constantFrom(
          0x54,
          0x55,
          0x55,
          0x5c,
          0x5d,
          0xa0,
          0xa1,
          0xa2,
          0xa3,
          0xa4,
        ),
      ),
      { minLength: 0, maxLength: 192 },
    )
    .map((ops) => new Uint8Array(ops))

const arbitraryAccount = () =>
  fc.record({
    balance: fc.bigInt({ min: 0n, max: 2n ** 96n }),
    code: fc.uint8Array({ maxLength: 8 }),
    nonce: fc.bigInt({ min: 0n, max: 100n }),
  })

const arbitraryStorage = () =>
  fc.array(
    fc.record({
      slot: fc.bigInt({ min: 0n, max: 4n }),
      value: word(),
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
  data: Uint8Array
  gas: bigint
  accounts: { balance: bigint; code: Uint8Array; nonce: bigint }[]
  storage: { slot: bigint; value: bigint }[]
  static?: boolean
}) {
  const caller = peers[2]
  const accounts = [
    {
      address: self,
      balance: options.accounts[0]?.balance ?? 0n,
      code: options.program,
      nonce: 1n,
    },
    ...peers.slice(0, 2).map((address, i) => ({
      address,
      balance: options.accounts[i + 1]?.balance ?? 0n,
      code: options.accounts[i + 1]?.code ?? new Uint8Array(0),
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

  const state = EvmState.fromMemory({
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

describe('TS interpreter matches the WASM engine over state', () => {
  test.prop(
    {
      accounts: fc.array(arbitraryAccount(), { minLength: 3, maxLength: 3 }),
      data: fc.uint8Array({ maxLength: 64 }),
      gas: fc.constantFrom(20_000n, 200_000n, 1_000_000n),
      program: arbitraryProgram(),
      storage: arbitraryStorage(),
    },
    { numRuns },
  )('programs over random pre-state agree', (options) => {
    compare(options)
  })

  test.prop(
    {
      accounts: fc.array(arbitraryAccount(), { minLength: 3, maxLength: 3 }),
      data: fc.uint8Array({ maxLength: 16 }),
      gas: fc.constantFrom(200_000n),
      program: arbitraryProgram(),
      storage: arbitraryStorage(),
    },
    { numRuns },
  )('static contexts agree', (options) => {
    compare({ ...options, static: true })
  })
})
