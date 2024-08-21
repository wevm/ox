import { Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Signature.serialize({
      r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      yParity: 1,
    }),
  ).toMatchInlineSnapshot(
    `"0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db801"`,
  )

  expect(
    Signature.serialize({
      r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      yParity: 0,
    }),
  ).toMatchInlineSnapshot(
    `"0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db800"`,
  )
})

test('args: to (bytes)', () => {
  expect(
    Signature.serialize(
      {
        r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
        s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
        yParity: 1,
      },
      { to: 'bytes' },
    ),
  ).toMatchInlineSnapshot(
    `
    Uint8Array [
      110,
      16,
      10,
      53,
      46,
      198,
      173,
      27,
      112,
      128,
      34,
      144,
      225,
      138,
      238,
      209,
      144,
      112,
      73,
      115,
      87,
      15,
      59,
      142,
      212,
      44,
      185,
      128,
      142,
      46,
      166,
      191,
      74,
      144,
      162,
      41,
      162,
      68,
      73,
      91,
      65,
      137,
      9,
      135,
      128,
      111,
      203,
      210,
      213,
      210,
      63,
      192,
      219,
      229,
      245,
      37,
      108,
      38,
      19,
      192,
      57,
      215,
      109,
      184,
      1,
    ]
  `,
  )
})

test('args: compact', () => {
  const signature = {
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  } as const
  const serialized = Signature.serialize(signature, { compact: true })
  expect(Signature.deserialize(serialized)).toEqual(signature)
  expect(serialized).toMatchInlineSnapshot(
    `"0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bfca90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8"`,
  )
})
