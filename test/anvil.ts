import { createServer } from 'prool'
import { type AnvilParameters, anvil } from 'prool/instances'
import type { JsonRpc } from 'ox'
import { request } from './request.js'

export const anvilMainnet = defineAnvil({
  forkUrl: getEnv('VITE_ANVIL_FORK_URL', 'https://cloudflare-eth.com'),
  forkBlockNumber: 19868020n,
  // noMining: true,
  port: 8545,
})

/////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////

function getEnv(key: string, fallback: string): string {
  if (typeof process.env[key] === 'string') return process.env[key] as string
  console.warn(
    `\`process.env.${key}\` not found. Falling back to \`${fallback}\`.`,
  )
  return fallback
}

function defineAnvil(parameters: AnvilParameters) {
  const { port } = parameters
  const poolId =
    Number(process.env.VITEST_POOL_ID ?? 1) *
    Number(process.env.VITEST_SHARD_ID ?? 1)
  const rpcUrl = `http://127.0.0.1:${port}/${poolId}`
  return {
    async request<methodName extends JsonRpc.MethodNameGeneric>(
      method: JsonRpc.ExtractMethodParameters<methodName>,
    ) {
      return await request(rpcUrl, method)
    },
    async restart() {
      await fetch(`${rpcUrl}/restart`)
    },
    rpcUrl,
    async start() {
      return await createServer({
        instance: anvil({
          ...parameters,
          hardfork: 'Prague',
        }),
        port,
      }).start()
    },
  }
}
