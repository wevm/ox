import * as fs from 'node:fs'
import * as path from 'node:path'
import { Hex, RpcTransport } from 'ox'
import { Evm, ExecutedTx } from 'ox/evm'

import { rpcDatabase } from './rpcDatabase.js'

/**
 * Records a mainnet transaction replay so `fork.test.ts` can run offline.
 *
 * Run with an archive endpoint: `VITE_ANVIL_FORK_URL=... node --import tsx
 * src/evm/_test/fork.record.ts`. Reads are pinned to the parent block, which is
 * the state the transaction executed against; a fork proxy is unnecessary because
 * nothing is mined, only read.
 */

/** The block whose first transaction is replayed. */
const number = 19868020n

/** Reads resolve here: the state the block started from. */
const parent = number - 1n

const url = process.env.VITE_ANVIL_FORK_URL ?? 'https://1.rpc.thirdweb.com'
const transport = RpcTransport.fromHttp(url, { timeout: 60_000 })
const node = { request: transport.request }

const shutdown = async () => {}

try {
  const block = (await node.request({
    method: 'eth_getBlockByNumber',
    params: [Hex.fromNumber(number), true],
  } as never)) as {
    baseFeePerGas: Hex.Hex
    gasLimit: Hex.Hex
    miner: Hex.Hex
    mixHash: Hex.Hex
    timestamp: Hex.Hex
    transactions: readonly { from: Hex.Hex; hash: Hex.Hex; type: Hex.Hex }[]
  }

  // Index zero is the only transaction whose starting state is the parent block
  // exactly; every later one also depends on its predecessors.
  const first = block.transactions[0]!
  const serialized = (await node.request({
    method: 'eth_getRawTransactionByHash',
    params: [first.hash],
  } as never)) as Hex.Hex
  const receipt = (await node.request({
    method: 'eth_getTransactionReceipt',
    params: [first.hash],
  } as never)) as {
    gasUsed: Hex.Hex
    logs: readonly { address: Hex.Hex; data: Hex.Hex; topics: Hex.Hex[] }[]
    status: Hex.Hex
  }

  const calls: { body: string; result: unknown }[] = []

  /**
   * Records each successful exchange, retrying a throttled one.
   *
   * The retry protocol asks for one value per attempt, so replaying a
   * transaction is tens of sequential requests, which a public endpoint
   * throttles. Recording happens rarely, so waiting is cheaper than requiring a
   * paid endpoint.
   */
  const fetchFn: typeof fetch = async (input, init) => {
    const body = String(init?.body)
    for (let attempt = 0; ; attempt++) {
      const response = await fetch(input, init)
      if (response.ok) {
        calls.push({ body, result: await response.clone().json() })
        return response
      }
      if (response.status !== 429 || attempt >= 12) return response
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 250))
    }
  }

  const evm = await Evm.create({
    block: {
      basefee: Hex.toBigInt(block.baseFeePerGas),
      beneficiary: block.miner,
      gasLimit: Hex.toBigInt(block.gasLimit),
      number,
      prevrandao: Hex.toBigInt(block.mixHash),
      timestamp: Hex.toBigInt(block.timestamp),
    },
    chainId: 1n,
    database: rpcDatabase(url, { blockNumber: parent, fetchFn }),
    specId: 'cancun',
  })

  const executed = await Evm.transact(evm, {
    from: first.from,
    serialized,
  })
  const result = ExecutedTx.result(executed)
  ExecutedTx.discard(executed)

  fs.writeFileSync(
    path.join(import.meta.dirname, 'fork.json'),
    `${JSON.stringify(
      {
        $comment:
          'Recorded by src/evm/_test/fork.record.ts. Regenerate with a fork available.',
        block: {
          basefee: block.baseFeePerGas,
          beneficiary: block.miner,
          gasLimit: block.gasLimit,
          number: Hex.fromNumber(number),
          prevrandao: block.mixHash,
          timestamp: block.timestamp,
        },
        calls,
        receipt: {
          gasUsed: receipt.gasUsed,
          logs: receipt.logs.map((log) => ({
            address: log.address,
            data: log.data,
            topics: log.topics,
          })),
          status: receipt.status,
        },
        transaction: { from: first.from, hash: first.hash, serialized },
      },
      null,
      2,
    )}\n`,
  )

  // biome-ignore lint/suspicious/noConsole: a script reports what it recorded
  console.log(
    `recorded ${first.hash} at block ${number}: ${calls.length} reads, gasUsed ${Hex.fromNumber(result.totalGasSpent - result.refunded)} vs receipt ${receipt.gasUsed}`,
  )
} finally {
  await shutdown()
}
