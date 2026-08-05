import { Bytes, Hash, Hex } from 'ox'
import { Database } from 'ox/evm'

/**
 * An asynchronous database over a JSON-RPC endpoint.
 *
 * A test helper rather than public API: evm2 ships only in-memory databases and
 * has no RPC-backed counterpart, so `ox/evm` does not either. This is what a
 * caller writes for themselves through
 * {@link ox#Database.(fromAsync:function)}, and what the fork replay reads
 * through.
 *
 * An account needs balance, nonce, and code, which go out as one batched request
 * rather than three round trips. That matters here because the retry protocol
 * discovers reads one at a time, so every request is a serialized round trip.
 */
export function rpcDatabase(
  url: string,
  options: {
    blockNumber?: bigint | undefined
    fetchFn?: typeof fetch | undefined
    timeout?: number | undefined
  } = {},
): Database.Async {
  const { blockNumber, fetchFn = fetch, timeout = 10_000 } = options
  const block =
    blockNumber === undefined ? 'latest' : Hex.fromNumber(blockNumber)

  let id = 0

  /** Sends one request, or a batch, and returns results in order. */
  async function send(
    calls: readonly { method: string; params: readonly unknown[] }[],
  ) {
    const body = calls.map((call) => ({ ...call, id: id++, jsonrpc: '2.0' }))
    const response = await fetchFn(url, {
      body: JSON.stringify(body.length === 1 ? body[0] : body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(timeout),
    })
    if (!response.ok) throw new Error(`${url} answered ${response.status}`)

    const parsed = await response.json()
    // A single-element batch is sent unwrapped, so the reply is too.
    const results = Array.isArray(parsed) ? parsed : [parsed]

    // A batch may answer out of order, so replies are matched by id.
    const byId = new Map(results.map((entry) => [entry.id, entry]))
    return body.map(({ id: sent, method }) => {
      const entry = byId.get(sent)
      if (!entry) throw new Error(`${url} did not answer ${method}`)
      if (entry.error) throw new Error(`${method}: ${entry.error.message}`)
      return entry.result
    })
  }

  return Database.fromAsync({
    async getAccount(address) {
      const [balance, nonce, code] = (await send([
        { method: 'eth_getBalance', params: [address, block] },
        { method: 'eth_getTransactionCount', params: [address, block] },
        { method: 'eth_getCode', params: [address, block] },
      ])) as [Hex.Hex, Hex.Hex, Hex.Hex]

      // A node answers zero for an account that does not exist and for an empty
      // one that does, so both are reported absent. evm2 reads an absent account
      // as balance and nonce zero, which is the same state.
      const bytes = Bytes.fromHex(code)
      if (
        Hex.toBigInt(balance) === 0n &&
        Hex.toBigInt(nonce) === 0n &&
        bytes.length === 0
      )
        return undefined

      return {
        balance: Hex.toBigInt(balance),
        ...(bytes.length ? { code: bytes } : {}),
        codeHash: Hash.keccak256(code),
        nonce: Hex.toBigInt(nonce),
      }
    },
    async getBlockHash(number) {
      const [header] = (await send([
        {
          method: 'eth_getBlockByNumber',
          params: [Hex.fromNumber(number), false],
        },
      ])) as [{ hash: Hex.Hex } | null]
      if (!header) throw new Error(`no block ${number}`)
      return header.hash
    },
    async getCodeByHash() {
      // Nodes key code by address, and `getAccount` supplies it inline, so the
      // engine never reaches this.
      throw new Error('this source cannot look code up by hash')
    },
    async getStorage(address, key) {
      const [value] = (await send([
        {
          method: 'eth_getStorageAt',
          params: [address, Hex.fromNumber(key), block],
        },
      ])) as [Hex.Hex]
      return Hex.toBigInt(value)
    },
  })
}
