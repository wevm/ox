import { RpcTransport } from 'ox'
import { Instance, Server } from 'prool'

export const anvilMainnet = defineAnvil({
  forkUrl: getEnv('VITE_ANVIL_FORK_URL', 'https://1.rpc.thirdweb.com'),
  forkBlockNumber: 19868020n,
  // noMining: true,
  port: 8545,
})

/////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////

function getEnv(key: string, fallback: string): string {
  if (typeof process.env[key] === 'string') return process.env[key] as string
  // biome-ignore lint/suspicious/noConsole: _
  console.warn(
    `\`process.env.${key}\` not found. Falling back to \`${fallback}\`.`,
  )
  return fallback
}

function defineAnvil(parameters: Instance.anvil.Parameters) {
  const { port } = parameters
  const poolId = Math.floor(Math.random() * 10000)
  const rpcUrl = `http://127.0.0.1:${port}/${poolId}`

  const config = {
    ...parameters,
    hardfork: 'Prague',
  } as const

  const transport = RpcTransport.fromHttp(rpcUrl)

  return {
    config,
    request: transport.request,
    async restart() {
      await fetch(`${rpcUrl}/restart`)
    },
    rpcUrl,
    async start() {
      return await Server.create({
        instance: Instance.anvil(config),
        port,
      }).start()
    },
  }
}
