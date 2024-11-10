import { Filter } from 'ox'
import { describe, expect, test } from 'vitest'

describe('fromRpc', () => {
  test('default', () => {
    {
      const filter = Filter.fromRpc({
        address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
      })
      expect(filter).toMatchInlineSnapshot(`
    {
      "address": "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
    }
  `)
    }

    {
      const filter = Filter.fromRpc({
        fromBlock: 'latest',
        toBlock: '0x010f2c',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          null,
          '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
        ],
      })
      expect(filter).toMatchInlineSnapshot(`
      {
        "fromBlock": "latest",
        "toBlock": 69420n,
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          null,
          "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
        ],
      }
    `)
    }

    {
      const filter = Filter.fromRpc({
        fromBlock: '0x010f2c',
        toBlock: 'latest',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          null,
          '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
        ],
      })
      expect(filter).toMatchInlineSnapshot(`
      {
        "fromBlock": 69420n,
        "toBlock": "latest",
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          null,
          "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
        ],
      }
    `)
    }
  })
})

describe('toRpc', () => {
  test('default', () => {
    {
      const filter = Filter.toRpc({
        address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
      })
      expect(filter).toMatchInlineSnapshot(`
    {
      "address": "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
    }
  `)
    }

    {
      const filter = Filter.toRpc({
        fromBlock: 'latest',
        toBlock: 69420n,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          null,
          '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
        ],
      })
      expect(filter).toMatchInlineSnapshot(`
        {
          "fromBlock": "latest",
          "toBlock": "0x10f2c",
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            null,
            "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
          ],
        }
      `)
    }

    {
      const filter = Filter.toRpc({
        fromBlock: 69420n,
        toBlock: 'latest',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          null,
          '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
        ],
      })
      expect(filter).toMatchInlineSnapshot(`
        {
          "fromBlock": "0x10f2c",
          "toBlock": "latest",
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            null,
            "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
          ],
        }
      `)
    }
  })
})

test('exports', () => {
  expect(Object.keys(Filter)).toMatchInlineSnapshot(`
    [
      "fromRpc",
      "toRpc",
    ]
  `)
})
