import { describe, expect, test } from 'vp/test'
import * as z_Filter from '../Filter.js'
import * as z from 'zod/mini'

const address = '0xfba3912ca04dd458c843e2ee08967fc04f3579c2'
const address2 = '0x0000000000000000000000000c04d9e9278ec5e4'
const blockHash = `0x${'11'.repeat(32)}` as const
const topic = `0x${'22'.repeat(32)}` as const
const topic2 = `0x${'33'.repeat(32)}` as const

describe('Filter', () => {
  test('decodes and encodes range filters', () => {
    expect(
      z.decode(z_Filter.Filter, {
        address: [address, address2],
        fromBlock: 'latest',
        toBlock: '0x010f2c',
        topics: [topic, null, [topic2]],
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": [
          "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
          "0x0000000000000000000000000c04d9e9278ec5e4",
        ],
        "fromBlock": "latest",
        "toBlock": 69420n,
        "topics": [
          "0x2222222222222222222222222222222222222222222222222222222222222222",
          null,
          [
            "0x3333333333333333333333333333333333333333333333333333333333333333",
          ],
        ],
      }
    `)
    expect(
      z.encode(z_Filter.Filter, {
        address: [address, address2],
        fromBlock: 'latest',
        toBlock: 69420n,
        topics: [topic, null, [topic2]],
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": [
          "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
          "0x0000000000000000000000000c04d9e9278ec5e4",
        ],
        "fromBlock": "latest",
        "toBlock": "0x10f2c",
        "topics": [
          "0x2222222222222222222222222222222222222222222222222222222222222222",
          null,
          [
            "0x3333333333333333333333333333333333333333333333333333333333333333",
          ],
        ],
      }
    `)
  })

  test('decodes block hash filters', () => {
    expect(
      z.decode(z_Filter.Filter, {
        address: null,
        blockHash,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": null,
        "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
      }
    `)
  })

  test('rejects invalid filters', () => {
    const invalidBlockRange: never = {
      blockHash,
      fromBlock: 'latest',
    } as never

    expect(z.safeDecode(z_Filter.Filter, invalidBlockRange).success).toBe(false)
    expect(z.safeDecode(z_Filter.Topics, ['0xz']).success).toBe(false)
    expect(z.safeDecode(z_Filter.Filter, { fromBlock: '0x' }).success).toBe(
      false,
    )
  })
})
