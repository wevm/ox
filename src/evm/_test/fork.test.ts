import * as fs from 'node:fs'
import * as path from 'node:path'
import { Hex } from 'ox'
import { Database, Evm, ExecutedTx, StateChange } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Replaying a real mainnet transaction against forked state.
 *
 * The gate the corpus differentials cannot reach: state nobody seeded, read
 * through a node, compared against what the chain itself recorded. The RPC
 * exchange is recorded once and committed, so the assertion runs offline.
 * Re-record with `node --import tsx src/evm/_test/fork.record.ts`.
 */

type Recording = {
  $comment: string
  block: {
    basefee: string
    beneficiary: string
    gasLimit: string
    number: string
    prevrandao: string
    timestamp: string
  }
  calls: readonly { body: string; result: unknown }[]
  receipt: {
    gasUsed: string
    logs: readonly {
      address: string
      data: string
      topics: readonly string[]
    }[]
    status: string
  }
  transaction: { from: string; hash: string; serialized: string }
}

const file = path.join(import.meta.dirname, 'fork.json')

/** Serves recorded exchanges, so nothing reaches the network. */
function replay(calls: Recording['calls']): typeof fetch {
  const byBody = new Map(calls.map((call) => [call.body, call.result]))
  return async (_input, init) => {
    const body = String(init?.body)
    if (!byBody.has(body)) throw new Error(`no recorded response for ${body}`)
    return new Response(JSON.stringify(byBody.get(body)), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/** Rebuilds the EVM the recording describes. */
async function fork(recording: Recording, fetchFn: typeof fetch) {
  return Evm.create({
    block: {
      basefee: BigInt(recording.block.basefee),
      beneficiary: recording.block.beneficiary as `0x${string}`,
      gasLimit: BigInt(recording.block.gasLimit),
      number: BigInt(recording.block.number),
      prevrandao: BigInt(recording.block.prevrandao),
      timestamp: BigInt(recording.block.timestamp),
    },
    chainId: 1n,
    // Reads resolve at the parent block, which is the state the transaction
    // executed against.
    database: Database.fromRpc('https://recorded.invalid', {
      blockNumber: BigInt(recording.block.number) - 1n,
      fetchFn,
    }),
    specId: 'cancun',
  })
}

describe('replay', () => {
  test('behavior: a mainnet transaction matches its own receipt', async () => {
    const recording = JSON.parse(fs.readFileSync(file, 'utf8')) as Recording

    const evm = await fork(recording, replay(recording.calls))
    const executed = await Evm.transact(evm, {
      from: recording.transaction.from as `0x${string}`,
      serialized: recording.transaction.serialized as `0x${string}`,
    })
    const result = ExecutedTx.result(executed)

    // What the chain recorded for this transaction, reached from forked state.
    expect(result.status).toBe(recording.receipt.status === '0x1')
    expect(Hex.fromNumber(result.totalGasSpent - result.refunded)).toBe(
      recording.receipt.gasUsed,
    )
    expect(
      result.logs.map((log) => ({
        address: log.address.toLowerCase(),
        data: log.data,
        topics: log.topics,
      })),
    ).toEqual(
      recording.receipt.logs.map((log) => ({
        address: log.address.toLowerCase(),
        data: log.data,
        topics: log.topics,
      })),
    )

    // Post-state is reachable, and committing it is what a block would do.
    const { pendingState } = ExecutedTx.detach(executed)
    const touched: string[] = []
    StateChange.visit(pendingState, {
      account: (change) => touched.push(change.address.toLowerCase()),
    })
    expect(touched).toContain(recording.transaction.from.toLowerCase())
  })
})
