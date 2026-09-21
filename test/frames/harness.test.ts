import { readFileSync } from 'node:fs'
import type { Address, Hex } from 'ox'
import { describe, expect } from 'vite-plus/test'
import { test } from './fixture.js'

type Fixture = {
  sender: Address.Address
  recipient: Address.Address
  serialized: Hex.Hex
  hash: Hex.Hex
}
const fixture: Fixture = JSON.parse(
  readFileSync(new URL('./fixtures/transfer.json', import.meta.url), 'utf8'),
)

describe('frame transaction harness', () => {
  test('mines the fixed signed transaction', async ({ rpc }) => {
    expect(
      await rpc.request({
        method: 'eth_getBalance',
        params: [fixture.recipient, 'latest'],
      }),
    ).toMatchInlineSnapshot('"0x1"')

    expect(
      await rpc.request({
        method: 'eth_sendRawTransaction',
        params: [fixture.serialized],
      }),
    ).toBe(fixture.hash)

    await expect
      .poll(
        () =>
          rpc.request({
            method: 'eth_getTransactionReceipt',
            params: [fixture.hash],
          }),
        { timeout: 20_000 },
      )
      .toMatchObject({
        transactionHash: fixture.hash,
        blockNumber: '0x1',
        type: '0x6',
        status: '0x1',
        payer: fixture.sender,
        frameReceipts: [
          {
            status: 1,
            executionGasUsed: '0x64',
            stateGasUsed: '0x0',
            logs: [],
          },
          {
            status: 1,
            executionGasUsed: '0xa28',
            stateGasUsed: '0x0',
            logs: [
              {
                address: '0xfffffffffffffffffffffffffffffffffffffffe',
                data: `0x${'0'.repeat(63)}1`,
                topics: [
                  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                  `0x${'0'.repeat(24)}${fixture.sender.slice(2)}`,
                  `0x${'0'.repeat(24)}${fixture.recipient.slice(2)}`,
                ],
              },
            ],
          },
        ],
      })

    expect(
      await rpc.request({
        method: 'eth_getBalance',
        params: [fixture.recipient, 'latest'],
      }),
    ).toMatchInlineSnapshot('"0x2"')
    expect(
      await rpc.request({
        method: 'eth_getTransactionCount',
        params: [fixture.sender, 'latest'],
      }),
    ).toMatchInlineSnapshot('"0x1"')

    await expect(
      rpc.request({
        method: 'eth_sendRawTransaction',
        params: [fixture.serialized],
      }),
    ).rejects.toThrow(/nonce/i)
  })

  test('starts each test from genesis', async ({ rpc }) => {
    expect(
      await rpc.request({ method: 'eth_blockNumber' }),
    ).toMatchInlineSnapshot('"0x0"')
    expect(
      await rpc.request({
        method: 'eth_getTransactionCount',
        params: [fixture.sender, 'latest'],
      }),
    ).toMatchInlineSnapshot('"0x0"')
    expect(
      await rpc.request({
        method: 'eth_getTransactionReceipt',
        params: [fixture.hash],
      }),
    ).toBeNull()
  })
})
