import * as fs from 'node:fs'
import * as path from 'node:path'
import { Bytes, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as PendingState from '../PendingState.js'
import * as StateChange from '../StateChange.js'
import * as codec from '../internal/codec.js'
import type * as Database from '../internal/database.js'
import * as engine from '../internal/engine.js'

/**
 * The WASM artifact against native evm2.
 *
 * `wasm/evm2/tests/oracle.rs` owns the `expected` half of this file, produced by
 * native `Evm::call_tx`. This side runs the same fixtures through the compiled
 * artifact and verifies the same expectations, so native and WASM evm2
 * disagreeing is a diff rather than two independently plausible results.
 *
 * Regenerate with `OX_UPDATE_FIXTURES=1 cargo test --test oracle` in
 * `wasm/evm2`.
 */

type Account = {
  address: string
  balance: string
  code: string
  codeHash: string
  nonce: number
}

type Expectation = {
  createdAddress: string | null
  errorCode: string | null
  floorGas: string
  handlerError?: string
  logs: readonly { address: string; data: string; topics: readonly string[] }[]
  output: string
  refunded: string
  stateGasSpent: string
  status: boolean
  stop: number
  totalGasSpent: string
  txGasUsed: string
}

type Pending = {
  accounts: readonly string[]
  bytecode: readonly string[]
  empty: boolean
  reads: readonly string[]
  storage: readonly string[]
  wipes: readonly string[]
}

type Fixture = {
  accounts: readonly Account[]
  block: Record<string, string>
  chainId: string
  envelope: string
  expected: Record<string, Expectation & { pendingState?: Pending }>
  name: string
  signer: string
}

const fixtures = JSON.parse(
  fs.readFileSync(
    path.join(import.meta.dirname, '../../../wasm/evm2/fixtures/call-tx.json'),
    'utf8',
  ),
) as { fixtures: readonly Fixture[]; specs: readonly string[] }

/** Serializes a result the way `oracle.rs` does, so the two are comparable. */
function encode(result: codec.TxResult): Expectation {
  const gas = (value: bigint) => Hex.fromNumber(value)
  const spent = result.totalGasSpent - result.refunded
  return {
    createdAddress: result.createdAddress?.toLowerCase() ?? null,
    errorCode: result.errorCode === undefined ? null : gas(result.errorCode),
    floorGas: gas(result.floorGas),
    logs: result.logs.map((log) => ({
      address: log.address.toLowerCase(),
      data: log.data,
      topics: log.topics,
    })),
    output: result.output,
    refunded: gas(result.refunded),
    stateGasSpent: gas(result.stateGasSpent),
    status: result.status,
    stop: result.stop,
    totalGasSpent: gas(result.totalGasSpent),
    txGasUsed: gas(spent > result.floorGas ? spent : result.floorGas),
  }
}

function database(accounts: readonly Account[]): Database.Database {
  const byAddress = new Map(
    accounts.map((account) => [account.address.toLowerCase(), account]),
  )
  const byCodeHash = new Map(
    accounts
      .filter((account) => account.code !== '0x')
      .map((account) => [account.codeHash.toLowerCase(), account.code]),
  )
  return {
    getAccount(address) {
      const account = byAddress.get(address.toLowerCase())
      if (!account) return undefined
      return {
        balance: BigInt(account.balance),
        codeHash: account.codeHash as Hex.Hex,
        nonce: BigInt(account.nonce),
      }
    },
    getBlockHash() {
      return `0x${'00'.repeat(32)}`
    },
    getCodeByHash(codeHash) {
      const code = byCodeHash.get(codeHash.toLowerCase())
      if (code === undefined) throw new Error(`no code for ${codeHash}`)
      return Bytes.fromHex(code as Hex.Hex)
    },
    getStorage() {
      return 0n
    },
  }
}

function block(fields: Record<string, string>): codec.Block {
  return {
    basefee: BigInt(fields.basefee!),
    beneficiary: fields.beneficiary! as `0x${string}`,
    blobBasefee: BigInt(fields.blobBasefee!),
    difficulty: BigInt(fields.difficulty!),
    gasLimit: BigInt(fields.gasLimit!),
    number: BigInt(fields.number!),
    prevrandao: BigInt(fields.prevrandao!),
    slotNum: BigInt(fields.slotNum!),
    timestamp: BigInt(fields.timestamp!),
  }
}

/**
 * Serializes detached state the way `oracle.rs` does.
 *
 * Sorted, because the grouped decoding on this side does not preserve the
 * interleaving the visit produced; the sets are what both halves agree on.
 */
function encodePending(state: PendingState.PendingState): Pending {
  const accounts: string[] = []
  const bytecode: string[] = []
  const reads: string[] = []
  const storage: string[] = []
  const wipes: string[] = []

  const info = (value?: codec.ChangeAccount) =>
    value
      ? `${Hex.fromNumber(value.balance)}/${value.nonce}/${value.codeHash}`
      : 'absent'

  StateChange.visit(state, {
    bytecode(codeHash, code) {
      bytecode.push(`${codeHash}|${Hex.fromBytes(code)}`)
    },
    account(change) {
      accounts.push(
        [
          change.address.toLowerCase(),
          info(change.original),
          info(change.current),
          change.created,
          change.selfdestructed,
        ].join('|'),
      )
    },
    accountRead(change) {
      reads.push(`${change.address.toLowerCase()}|${info(change.current)}`)
    },
    storage(change) {
      storage.push(
        [
          change.address.toLowerCase(),
          Hex.fromNumber(change.key),
          Hex.fromNumber(change.original!),
          Hex.fromNumber(change.current),
        ].join('|'),
      )
    },
    storageRead(change) {
      storage.push(
        [
          change.address.toLowerCase(),
          Hex.fromNumber(change.key),
          'read',
          Hex.fromNumber(change.current),
        ].join('|'),
      )
    },
    storageWipe(address) {
      wipes.push(address.toLowerCase())
    },
  })

  return {
    accounts: accounts.sort(),
    bytecode: bytecode.sort(),
    empty: PendingState.isEmpty(state),
    reads: reads.sort(),
    storage: storage.sort(),
    wipes: wipes.sort(),
  }
}

describe('transact', () => {
  for (const spec of fixtures.specs)
    for (const fixture of fixtures.fixtures)
      test(`${spec}: ${fixture.name} detaches the state native evm2 records`, async () => {
        const expected = fixture.expected[spec]!
        if (expected.handlerError) return

        const evm = await engine.create({
          block: block(fixture.block),
          chainId: BigInt(fixture.chainId),
          database: database(fixture.accounts),
          specId: codec.specId[spec as keyof typeof codec.specId],
        })

        // Same execution as `callTx`, resolved by detaching so the pending state
        // native evm2 recorded is comparable rather than discarded.
        const { result, token } = evm.transact({
          envelope: Bytes.fromHex(fixture.envelope as Hex.Hex),
          signer: fixture.signer as `0x${string}`,
        })
        const state = PendingState.from(evm.detach(token))

        const { pendingState, ...rest } = expected
        expect(encode(result)).toEqual(rest)
        expect(encodePending(state)).toEqual(pendingState)
      })
})

describe('callTx', () => {
  for (const spec of fixtures.specs)
    for (const fixture of fixtures.fixtures)
      test(`${spec}: ${fixture.name} matches native evm2`, async () => {
        const expected = fixture.expected[spec]!
        const evm = await engine.create({
          block: block(fixture.block),
          chainId: BigInt(fixture.chainId),
          database: database(fixture.accounts),
          specId: codec.specId[spec as keyof typeof codec.specId],
        })

        const call = () =>
          evm.callTx({
            envelope: Bytes.fromHex(fixture.envelope as Hex.Hex),
            signer: fixture.signer as `0x${string}`,
          })

        // A fixture native evm2 rejected must be rejected here too, for the
        // same stated reason.
        if (expected.handlerError) {
          expect(call).toThrowError(expected.handlerError)
          return
        }
        // `pendingState` belongs to the `transact` block below: `callTx` discards
        // state before a caller can observe it.
        const { pendingState: _, ...result } = expected
        expect(encode(call())).toEqual(result)
      })
})

describe('fixtures', () => {
  test('every fixture is exercised on every declared spec', () => {
    for (const fixture of fixtures.fixtures)
      expect(Object.keys(fixture.expected).sort()).toEqual(
        [...fixtures.specs].sort(),
      )
  })

  test('every recorded envelope recovers to its recorded signer', () => {
    // evm2 takes the signer from `Recovered` and never re-derives it, so a
    // fixture whose envelope and signer disagree would still execute, just not
    // as the transaction it claims to be.
    for (const fixture of fixtures.fixtures) {
      const envelope = TxEnvelopeLegacy.deserialize(fixture.envelope as Hex.Hex)
      const { r, s, yParity } = envelope
      const recovered = Secp256k1.recoverAddress({
        payload: TxEnvelopeLegacy.getSignPayload({
          ...envelope,
          r: undefined,
          s: undefined,
          v: undefined,
          yParity: undefined,
        } as never),
        signature: { r: r!, s: s!, yParity: yParity! },
      })
      expect([fixture.name, recovered.toLowerCase()]).toEqual([
        fixture.name,
        fixture.signer.toLowerCase(),
      ])
    }
  })
})
