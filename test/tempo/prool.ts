import { RpcTransport } from 'ox'
import { Instance, Server } from 'prool'
import * as TestContainers from 'prool/testcontainers'

export const port = Number(import.meta.env.VITE_TEMPO_PORT ?? 3000)

export const rpcUrl = (() => {
  if (import.meta.env.VITE_TEMPO_RPC_URL)
    return import.meta.env.VITE_TEMPO_RPC_URL
  if (import.meta.env.VITE_TEMPO_ENV === 'devnet')
    return 'https://rpc.devnet.tempoxyz.dev'
  if (import.meta.env.VITE_TEMPO_ENV === 'testnet')
    return 'https://rpc.moderato.tempo.xyz'
  const id =
    (typeof import.meta !== 'undefined' &&
      Number(import.meta.env.VITEST_POOL_ID ?? 1) +
        Math.floor(Math.random() * 10_000)) ||
    1 + Math.floor(Math.random() * 10_000)
  return `http://localhost:${port}/${id}`
})()

export async function createServer(options: createServer.Options = {}) {
  const serverPort = options.port ?? port
  const tag = await (async () => {
    // Default to `edge` which tracks `tempoxyz/tempo` main and includes
    // unreleased features the tests depend on (e.g. TIP-1049 admin keys).
    // The `latest` tag lags behind released versions.
    const envTag = options.tag ?? import.meta.env.VITE_TEMPO_TAG ?? 'edge'
    if (!envTag.startsWith('http')) return envTag

    const transport = RpcTransport.fromHttp(envTag)
    const result = (await transport.request({
      method: 'web3_clientVersion',
    })) as string
    const sha = result.match(/tempo\/v[\d.]+-([a-f0-9]+)\//)?.[1]
    return `sha-${sha}`
  })()

  const args = {
    blockTime: '2ms',
    log: import.meta.env.VITE_TEMPO_LOG,
    port: serverPort,
  } satisfies Instance.tempo.Parameters

  return Server.create({
    instance: tag
      ? TestContainers.Instance.tempo({
          ...args,
          image: `ghcr.io/tempoxyz/tempo:${tag}`,
        })
      : Instance.tempo(args),
    port: serverPort,
  })
}

export declare namespace createServer {
  export type Options = {
    port?: number | undefined
    tag?: string | undefined
  }
}
