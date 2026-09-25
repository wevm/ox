import { fileURLToPath } from 'node:url'
import { Instance, Server } from 'prool'
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'

export const port = Number(import.meta.env.VITE_FRAMES_PORT ?? 3001)
export const rpcUrl = `http://localhost:${port}/${Number(import.meta.env.VITEST_POOL_ID ?? 1) + Math.floor(Math.random() * 10_000)}`

export const reth = Instance.define(() => {
  let container: StartedTestContainer | undefined

  return {
    name: 'reth',
    host: 'localhost',
    port: 8545,
    async start({ port = 8545 }, { emitter }) {
      container = await new GenericContainer(
        'ghcr.io/wevm/reth:sha-0acab10e8123',
      )
        .withPlatform('linux/amd64')
        .withExposedPorts({ container: 8545, host: port })
        .withCopyFilesToContainer([
          {
            source: fileURLToPath(new URL('./chainspec.json', import.meta.url)),
            target: '/tmp/frames.json',
          },
        ])
        .withCommand([
          'node',
          '--chain',
          '/tmp/frames.json',
          '--dev',
          '--http',
          '--http.addr',
          '0.0.0.0',
          '--http.api',
          'eth,net,web3',
          '--ipcdisable',
        ])
        .withWaitStrategy(Wait.forLogMessage('RPC HTTP server started'))
        .withStartupTimeout(120_000)
        .withLogConsumer((stream) => {
          stream.on('data', (data) => {
            const message = data.toString()
            emitter.emit('message', message)
            emitter.emit('stdout', message)
            if (import.meta.env.VITE_FRAMES_LOG) console.log(message)
          })
        })
        .start()
    },
    async stop() {
      await container?.stop()
      container = undefined
    },
  }
})

export function createServer() {
  return Server.create({ instance: reth(), port })
}
