import { fileURLToPath } from 'node:url'
import { Instance, Server } from 'prool'
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'

export const port = Number(import.meta.env.VITE_FRAMES_PORT ?? 3001)
export const rpcUrl = `http://localhost:${port}/${Number(import.meta.env.VITEST_POOL_ID ?? 1) + Math.floor(Math.random() * 10_000)}`

export const nethermind = Instance.define(() => {
  let container: StartedTestContainer | undefined

  return {
    name: 'nethermind',
    host: 'localhost',
    port: 8545,
    async start({ port = 8545 }, { emitter }) {
      container = await new GenericContainer(
        'ghcr.io/wevm/nethermind-frames@sha256:1f8e5b5698e18af41849fd95016271a96f8d7fd192014270c08d0306283dc07a',
      )
        .withExposedPorts({ container: 8545, host: port })
        .withCopyFilesToContainer([
          {
            source: fileURLToPath(new URL('./chainspec.json', import.meta.url)),
            target: '/tmp/frames.json',
          },
        ])
        .withCommand([
          '--config',
          'spaceneth',
          '--Init.ChainSpecPath',
          '/tmp/frames.json',
          '--Init.EnableUnsecuredDevWallet',
          'false',
          '--Init.LogDirectory',
          '/tmp/logs',
          '--JsonRpc.Host',
          '0.0.0.0',
          '--JsonRpc.EnabledModules',
          'Eth,Net,Web3',
        ])
        .withWaitStrategy(Wait.forLogMessage('Initialization Completed'))
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
  return Server.create({ instance: nethermind(), port })
}
