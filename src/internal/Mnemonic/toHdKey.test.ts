import { Mnemonic } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const hdKey = Mnemonic.toHdKey(
    'test test test test test test test test test test test junk',
  ).derive(Mnemonic.path())
  expect(hdKey).toMatchInlineSnapshot(`
    {
      "depth": 5,
      "derive": [Function],
      "identifier": "0xa55476015c13afb8afb92160329a8cde976f1f2e",
      "index": 0,
      "privateExtendedKey": "xprvA3KbAeguosodJeRqpV3NF1VYREub6vBASfBEXa1LgZeqPAhCFkHQMBjXYPa8RZvP5tnWMSg2zYcox5vbsfz1pB7J2zU9LEzWxg7rrRpoeSh",
      "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "publicExtendedKey": "xpub6GJwaADoeFMvX8WJvWaNc9SGyGk5WNu1ot6qKxQxEuBpFy2LoHbetz41PgEcEg4n2bk3hWoHYJ69EqkjpoSv9KrinCnZV6y4Xo6VJZ6KHWT",
      "publicKey": {
        "prefix": 4,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      },
      "versions": {
        "private": 76066276,
        "public": 76067358,
      },
    }
  `)
})
