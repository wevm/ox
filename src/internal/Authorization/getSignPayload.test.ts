import { Authorization } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Authorization.getSignPayload({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    }),
  ).toMatchInlineSnapshot(
    `"0x5919da563810a99caf657d42bd10905adbd28b3b89b8a4577efa471e5e4b3914"`,
  )

  expect(
    Authorization.getSignPayload({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 69,
      nonce: 420n,
    }),
  ).toMatchInlineSnapshot(
    `"0x7bdd120f6437316be99b11232d472bb0209d20d7c564f4dfbad855189e830b15"`,
  )
})
