import { Hex, Secp256k1, ValidatorData } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

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
      "r": 68091374341839800456303976073526891582562581240638500897335670993181392578160n,
      "s": 5314928325393385878350538135103735910463811711406436189774790168957633678215n,
      "yParity": 0,
    }
  `)
})
