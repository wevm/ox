import { fileURLToPath } from 'node:url'
import { RpcTransport } from 'ox'
import { GenericContainer, Wait } from 'testcontainers'
import { expect, onTestFailed, test as base } from 'vite-plus/test'

export const image =
  'ghcr.io/wevm/nethermind-frames@sha256:1f8e5b5698e18af41849fd95016271a96f8d7fd192014270c08d0306283dc07a'

export const test = base.extend<{ rpc: RpcTransport.Http }>({
  rpc: async ({ task }, use) => {
    let logs = ''
    onTestFailed(() =>
      console.error(`Nethermind logs for ${task.name}:\n${logs}`),
    )
    const container = await new GenericContainer(image)
      .withExposedPorts(8545)
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
          logs = (logs + data.toString()).slice(-32_000)
        })
      })
      .start()
      .catch((cause) => {
        throw new Error(`Nethermind failed to start:\n${logs}`, { cause })
      })

    try {
      const rpc = RpcTransport.fromHttp(
        `http://${container.getHost()}:${container.getMappedPort(8545)}`,
        { timeout: 5_000 },
      )
      await expect
        .poll(() => rpc.request({ method: 'eth_chainId' }), { timeout: 10_000 })
        .toBe('0x1fcd')
      await use(rpc)
    } finally {
      await container.stop()
    }
  },
})
