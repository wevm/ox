import { P256 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const privateKey = accounts[0].privateKey

test('default', () => {
  const payload = '0xdeadbeef'
  const { r, s } = P256.sign({ payload, privateKey })
  const publicKey = P256.getPublicKey({ privateKey })
  expect(P256.verify({ publicKey, payload, signature: { r, s } })).toBe(true)
})
