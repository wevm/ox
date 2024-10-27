import { Bytes, Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Signature.deserialize(
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c',
    ),
  ).toEqual({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  })

  expect(
    Signature.deserialize(
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81b',
    ),
  ).toEqual({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 0,
  })

  expect(
    Signature.deserialize(
      '0x602381e57b70f1ada20bd56a806291cfc5cb5088f00f0e791510fd8b8cf05cc40dea7b983e0c7d204f3dc511b1f19a2787a5c82cd72f3bd38da58f10969907841b',
    ),
  ).toEqual({
    r: 43484769623367213860417783105635222705150611167432112567800024380109931699396n,
    s: 6294362263987653295407096796775254566164834706640834070377421739817648588676n,
    yParity: 0,
  })

  expect(
    Signature.deserialize(
      Bytes.fromHex(
        '0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b00',
      ),
    ),
  ).toEqual({
    r: 74352382517807082440778846078252240710763999160569457624520311883943391062769n,
    s: 43375188480015931414505591342117068151247353833881461609019650667261881302875n,
    yParity: 0,
  })

  expect(
    Signature.deserialize(
      Bytes.fromHex(
        '0xc4d8bcda762d35ea79d9542b23200f46c2c1899db15bf929bbacaf609581db0831538374a01206517edd934e474212a0f1e2d62e9a01cd64f1cf94ea2e09884901',
      ),
    ),
  ).toEqual({
    r: 89036260706339362183898531363310683680162157132496689422406521430939707497224n,
    s: 22310885159939283473640002814069314990500333570711854513358211093549688653897n,
    yParity: 1,
  })

  expect(
    Signature.deserialize(
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    ),
  ).toMatchInlineSnapshot(`
    {
      "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    }
  `)
})

test('error: invalid signature', async () => {
  expect(() =>
    Signature.deserialize('0xdeadbeef'),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Signature.InvalidSerializedSizeError: Value \`0xdeadbeef\` is an invalid signature size.

    Expected: 64 bytes or 65 bytes.
    Received 4 bytes.]
  `,
  )
})

test('error: invalid yParity', async () => {
  expect(() =>
    Signature.deserialize(
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81d',
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidYParityError: Value `29` is an invalid y-parity value. Y-parity must be 0 or 1.]',
  )
  expect(() =>
    Signature.deserialize(
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db802',
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidYParityError: Value `2` is an invalid y-parity value. Y-parity must be 0 or 1.]',
  )
  expect(() =>
    Signature.deserialize(
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81a',
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    '[Signature.InvalidYParityError: Value `26` is an invalid y-parity value. Y-parity must be 0 or 1.]',
  )
})
