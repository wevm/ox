import { RpcTransport } from 'ox'
import { describe, expect, test } from 'vite-plus/test'
import { accounts } from '../constants/accounts.js'
import { rpcUrl } from './prool.js'

const rpc = RpcTransport.fromHttp(rpcUrl)

describe('reth', () => {
  test('starts a funded development chain', async () => {
    expect(await rpc.request({ method: 'web3_clientVersion' })).toContain(
      'reth/',
    )
    expect(await rpc.request({ method: 'eth_chainId' })).toMatchInlineSnapshot(
      '"0x1fcd"',
    )
    expect(
      await rpc.request({ method: 'eth_blockNumber' }),
    ).toMatchInlineSnapshot('"0x0"')
    expect(
      await rpc.request({
        method: 'eth_getBalance',
        params: [accounts[0].address, 'latest'],
      }),
    ).toMatchInlineSnapshot('"0x3635c9adc5dea00000"')
  })

  test('restarts through prool', async () => {
    const response = await fetch(`${rpcUrl}/restart`)
    expect(response.status).toBe(200)
    expect(await rpc.request({ method: 'eth_chainId' })).toMatchInlineSnapshot(
      '"0x1fcd"',
    )
  })
})
