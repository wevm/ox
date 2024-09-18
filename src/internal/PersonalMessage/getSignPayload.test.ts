import { Hex, PersonalMessage, Secp256k1 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

test('default', () => {
  expect(
    PersonalMessage.getSignPayload(Hex.fromString('hello world')),
  ).toMatchInlineSnapshot(
    `"0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68"`,
  )
})

test('behavior: signature', () => {
  const payload = PersonalMessage.getSignPayload(Hex.fromString('hello world'))

  const signature = Secp256k1.sign({
    payload,
    privateKey: accounts[0].privateKey,
  })

  expect(signature).toMatchInlineSnapshot(`
    {
      "r": 74352382517807082440778846078252240710763999160569457624520311883943391062769n,
      "s": 43375188480015931414505591342117068151247353833881461609019650667261881302875n,
      "yParity": 0,
    }
  `)
})
