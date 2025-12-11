import { Bytes, Hex, Secp256k1, ValidatorData } from 'ox'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('encode', () => {
  test('default', () => {
    expect(
      ValidatorData.encode({
        data: Hex.fromString('hello world'),
        validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      }),
    ).toMatchInlineSnapshot(
      `"0x1900d8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64"`,
    )
    expect(
      ValidatorData.encode({
        data: Bytes.fromString('hello world'),
        validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      }),
    ).toMatchInlineSnapshot(
      `"0x1900d8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64"`,
    )
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    expect(
      ValidatorData.getSignPayload({
        data: Hex.fromString('hello world'),
        validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      }),
    ).toMatchInlineSnapshot(
      `"0xb870765d23e6160a006346632154b436c5c90582d7df112841e8f429d8d04804"`,
    )
  })

  test('behavior: signature', () => {
    const payload = ValidatorData.getSignPayload({
      data: Hex.fromString('hello world'),
      validator: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    })

    const signature = Secp256k1.sign({
      payload,
      privateKey: accounts[0].privateKey,
    })

    expect(signature).toMatchInlineSnapshot(`
      {
        "r": "0x968a5a252cd492163d4cd6b503157839ad28cc55eaa3bf96fcb3757e0e192670",
        "s": "0x0bc0249059a16d6176ece20090dc8ad77ea46627281ec1b3c04aa54058c3cb87",
        "yParity": 0,
      }
    `)
  })
})

test('exports', () => {
  expect(Object.keys(ValidatorData)).toMatchInlineSnapshot(`
    [
      "encode",
      "getSignPayload",
    ]
  `)
})
