import { fc, test } from '@fast-check/vitest'
import { expect } from 'vp/test'

import * as journal from '../internal/journal.js'

const numRuns = Number(process.env.FC_NUM_RUNS) || 100

// Property: whatever a frame does between checkpoint and revert, reverting
// restores the journal to a state indistinguishable from the checkpoint.
// Originals are exempt by design — they are transaction-scoped.

const address = () =>
  fc
    .integer({ min: 0, max: 4 })
    .map((i) => `0x${(0xc0 + i).toString(16).padStart(40, '0')}`)

const word = () => fc.bigInt({ min: 0n, max: 2n ** 256n - 1n })
const slot = () => fc.bigInt({ min: 0n, max: 7n })

type Op = (state: journal.Journal) => void

const arbitraryOp: () => fc.Arbitrary<Op> = () =>
  fc.oneof(
    fc.tuple(address(), word()).map(
      ([a, v]) =>
        (s: journal.Journal) =>
          journal.setBalance(s, a, v),
    ),
    fc.tuple(address(), word()).map(
      ([a, v]) =>
        (s: journal.Journal) =>
          journal.setNonce(s, a, v),
    ),
    fc.tuple(address(), fc.uint8Array({ maxLength: 8 })).map(
      ([a, c]) =>
        (s: journal.Journal) =>
          journal.setCode(s, a, c),
    ),
    fc.tuple(address(), slot(), word()).map(
      ([a, k, v]) =>
        (s: journal.Journal) =>
          journal.setStorage(s, a, k, v),
    ),
    fc.tuple(address(), slot(), word()).map(
      ([a, k, v]) =>
        (s: journal.Journal) =>
          journal.setTransient(s, a, k, v),
    ),
    fc.tuple(address()).map(
      ([a]) =>
        (s: journal.Journal) =>
          journal.warmAddress(s, a),
    ),
    fc.tuple(address(), slot()).map(
      ([a, k]) =>
        (s: journal.Journal) =>
          journal.warmSlot(s, a, k),
    ),
    fc
      .bigInt({ min: -5000n, max: 20_000n })
      .map((d) => (s: journal.Journal) => journal.addRefund(s, d)),
    fc.tuple(address(), fc.uint8Array({ maxLength: 4 })).map(
      ([a, data]) =>
        (s: journal.Journal) =>
          journal.addLog(s, { address: a, data, topics: [1n] }),
    ),
    fc.tuple(address()).map(
      ([a]) =>
        (s: journal.Journal) =>
          journal.markSelfdestructed(s, a),
    ),
    fc.tuple(address()).map(
      ([a]) =>
        (s: journal.Journal) =>
          journal.markCreated(s, a),
    ),
  )

/** Deep, order-insensitive snapshot of everything revert must restore. */
function snapshot(state: journal.Journal) {
  const map = <k, v>(entries: Map<k, v>, render: (value: v) => unknown) =>
    [...entries.entries()]
      .map(([key, value]) => [String(key), render(value)] as const)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const nested = (maps: Map<string, Map<bigint, bigint>>) =>
    map(maps, (inner) => map(inner, String))
  return JSON.stringify({
    accounts: map(state.accounts, (account) =>
      account === null
        ? null
        : {
            balance: String(account.balance),
            hasCode: account.hasCode ?? null,
            nonce: String(account.nonce),
          },
    ),
    codes: map(state.codes, (code) => [...code].join(',')),
    created: [...state.created].sort(),
    logs: state.logs.map((log) => ({
      address: log.address,
      data: [...log.data].join(','),
      topics: log.topics.map(String),
    })),
    refund: String(state.refund),
    selfdestructs: [...state.selfdestructs].sort(),
    storage: nested(state.storage),
    transient: nested(state.transient),
    warmAddresses: [...state.warmAddresses].sort(),
    warmSlots: map(state.warmSlots, (slots) => [...slots].map(String).sort()),
  })
}

/**
 * Seeds every address and slot the op generators can touch. Seeds are
 * pre-state cache fills — they live beneath the journal and survive revert
 * by design — so the properties fetch everything before checkpointing.
 */
function seedAll(state: journal.Journal): void {
  for (let i = 0; i < 5; i++) {
    const account = `0x${(0xc0 + i).toString(16).padStart(40, '0')}`
    journal.seed(state, {
      account:
        i === 0
          ? {
              balance: 100n,
              code: new Uint8Array([0x00]),
              hasStorage: false,
              nonce: 1n,
            }
          : undefined,
      address: account,
      kind: 'account',
    })
    for (let k = 0n; k <= 7n; k++)
      journal.seed(state, {
        address: account,
        kind: 'storage',
        slot: k,
        value: 0n,
      })
  }
}

test.prop(
  {
    prefix: fc.array(arbitraryOp(), { maxLength: 20 }),
    suffix: fc.array(arbitraryOp(), { minLength: 1, maxLength: 40 }),
  },
  { numRuns },
)('revert restores the checkpoint state exactly', ({ prefix, suffix }) => {
  const state = journal.create()
  seedAll(state)
  for (const op of prefix) op(state)

  const checkpoint = journal.checkpoint(state)
  const before = snapshot(state)
  for (const op of suffix) op(state)
  journal.revert(state, checkpoint)

  expect(snapshot(state)).toBe(before)
})

test.prop({ ops: fc.array(arbitraryOp(), { maxLength: 30 }) }, { numRuns })(
  'nested checkpoints revert independently',
  ({ ops }) => {
    const state = journal.create()
    seedAll(state)
    const outer = journal.checkpoint(state)
    const outerSnapshot = snapshot(state)
    for (const [i, op] of ops.entries()) {
      if (i === Math.floor(ops.length / 2)) {
        const inner = journal.checkpoint(state)
        const innerSnapshot = snapshot(state)
        op(state)
        journal.revert(state, inner)
        expect(snapshot(state)).toBe(innerSnapshot)
      } else op(state)
    }
    journal.revert(state, outer)
    expect(snapshot(state)).toBe(outerSnapshot)
  },
)
