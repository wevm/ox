import { fc, test } from '@fast-check/vitest'
import { Address, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import {
  Database,
  Evm,
  ExecutedTx,
  PendingState,
  StateChange,
  TxResult,
} from 'ox/evm'
import { describe, expect } from 'vp/test'

import { numRuns } from '../../../test/fuzz/numRuns.js'

/**
 * Properties that hold for every transaction, whatever it does.
 *
 * The generated corpus in `oracle.test.ts` compares against native evm2 on
 * recorded cases. These are the relationships that must hold on inputs nobody
 * recorded: the equivalences between entry points, and the arithmetic a result
 * has to satisfy.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

/**
 * Snippets worth reaching, mixed with arbitrary bytes.
 *
 * `BLOCKHASH` is absent: `fromMemory` fails an unseeded hash where evm2's own
 * dev database synthesizes one, a recorded divergence rather than a defect.
 */
const codes = [
  '0x',
  '0x00',
  '0x602a5f5260205ff3',
  '0x5f545f52602a5f5560205ff3',
  '0x60015f5500',
  '0x5f5f5500',
  '0x5f5ffd',
  '0xfe',
  '0x5f5f5fa100',
  '0x33ff',
  '0x5f5f20505f5260205ff3',
  '0x5f61ffff5200',
  '0x5b5f56',
  '0x4700',
  // A valid EIP-7702 designator: `0xef0100` and a 20-byte address.
  `0xef0100${'11'.repeat(20)}`,
] as const

/** Arbitrary contract code. Whatever it decodes to, execution must be lawful. */
const arbitraryCode = fc.oneof(
  { arbitrary: fc.constantFrom(...codes), weight: 3 },
  {
    arbitrary: fc
      .uint8Array({ maxLength: 24 })
      .map((bytes) => Hex.fromBytes(bytes))
      // A malformed designator is rejected when the account is declared, not
      // when it executes, so it is not an execution input.
      .filter((code) => !code.startsWith('0xef01')),
    weight: 1,
  },
)

const arbitraryTx = fc.record({
  code: arbitraryCode,
  gas: fc.constantFrom(21_000n, 30_000n, 100_000n, 200_000n),
  storage: fc.dictionary(
    fc.constantFrom('0', '1', '2'),
    fc.constantFrom(0n, 1n, 42n),
    { maxKeys: 2 },
  ),
  value: fc.constantFrom(0n, 1n, 1_000n),
})

type Input =
  typeof arbitraryTx extends fc.Arbitrary<infer value> ? value : never

function transaction(input: Input) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: input.gas,
    gasPrice: 0n,
    nonce: 0n,
    to: target,
    value: input.value,
  })
  const signature = Secp256k1.sign({
    payload: TxEnvelopeLegacy.getSignPayload(envelope),
    privateKey,
  })
  return {
    from: sender,
    serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
  }
}

function evm(input: Input) {
  return Evm.create({
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code: input.code, storage: input.storage },
      },
    }),
  })
}

/** Records each streamed change as a comparable string. */
function trace(out: string[]): StateChange.Sink {
  return {
    account: (change) => out.push(`account:${change.address}`),
    accountRead: (change) => out.push(`accountRead:${change.address}`),
    bytecode: (codeHash) => out.push(`bytecode:${codeHash}`),
    storage: (change) => out.push(`storage:${change.address}:${change.key}`),
    storageRead: (change) =>
      out.push(`storageRead:${change.address}:${change.key}`),
    storageWipe: (address) => out.push(`wipe:${address}`),
  }
}

describe('Evm properties', () => {
  test.prop({ input: arbitraryTx }, { numRuns })(
    'callTx equals transact then discard',
    async ({ input }) => {
      // Two entry points into one execution: the result cannot depend on which
      // resolution the caller intends.
      const called = Evm.callTx(await evm(input), transaction(input))
      const executed = Evm.transact(await evm(input), transaction(input))
      const discarded = ExecutedTx.discard(executed)

      expect(discarded).toEqual(called)
    },
  )

  test.prop({ input: arbitraryTx }, { numRuns })(
    'gas accounting is internally consistent',
    async ({ input }) => {
      const result = Evm.callTx(await evm(input), transaction(input))

      // Refunds cannot exceed what was spent, the EIP-7623 floor is a floor, and
      // state gas is a component of the total rather than an addition to it.
      expect(result.refunded).toBeLessThanOrEqual(result.totalGasSpent)
      expect(result.stateGasSpent).toBeLessThanOrEqual(result.totalGasSpent)
      expect(result.totalGasSpent).toBeLessThanOrEqual(input.gas)
      expect(TxResult.txGasUsed(result)).toBeGreaterThanOrEqual(result.floorGas)
    },
  )

  test.prop({ input: arbitraryTx }, { numRuns })(
    'detached state agrees with what the same execution streams',
    async ({ input }) => {
      const streamed: string[] = []
      ExecutedTx.discardWith(
        Evm.transact(await evm(input), transaction(input)),
        trace(streamed),
      )

      const visited: string[] = []
      const { pendingState } = ExecutedTx.detach(
        Evm.transact(await evm(input), transaction(input)),
      )
      StateChange.visit(pendingState, trace(visited))

      // Detached state retains loads the live stream elides, so the live
      // sequence must be a subsequence of the detached one, in order.
      expect(visited.filter((event) => streamed.includes(event))).toEqual(
        streamed,
      )
      expect(PendingState.isEmpty(pendingState)).toBe(visited.length === 0)
    },
  )

  test.prop({ input: arbitraryTx }, { numRuns })(
    'a committed transaction advances the nonce exactly once',
    async ({ input }) => {
      const instance = await evm(input)
      ExecutedTx.commit(Evm.transact(instance, transaction(input)))

      // Execution may revert or halt, but a transaction evm2 accepted always
      // charges its sender's nonce.
      expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(1n)
    },
  )

  test.prop({ input: arbitraryTx }, { numRuns })(
    'a resolved handle never resolves twice',
    async ({ input }) => {
      const executed = Evm.transact(await evm(input), transaction(input))
      ExecutedTx.discard(executed)

      expect(() => ExecutedTx.discard(executed)).toThrowError()
      expect(() => ExecutedTx.commit(executed)).toThrowError()
    },
  )
})
