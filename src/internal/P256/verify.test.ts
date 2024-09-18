import { Bytes, P256 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const privateKey = accounts[0].privateKey

test('default', () => {
  const payload = '0xdeadbeef'
  const { r, s } = P256.sign({ payload, privateKey })
  const publicKey = P256.getPublicKey({ privateKey })
  expect(P256.verify({ publicKey, payload, signature: { r, s } })).toBe(true)
})

test('behavior: bytes payload', () => {
  const payload = '0xdeadbeef'
  const { r, s } = P256.sign({ payload, privateKey })
  const publicKey = P256.getPublicKey({ privateKey })
  expect(
    P256.verify({
      publicKey,
      payload: Bytes.fromHex(payload),
      signature: { r, s },
    }),
  ).toBe(true)
})

test('options: hash', () => {
  const payload = '0xdeadbeef'
  const { r, s } = P256.sign({ hash: true, payload, privateKey })
  const publicKey = P256.getPublicKey({ privateKey })
  expect(
    P256.verify({ hash: true, publicKey, payload, signature: { r, s } }),
  ).toBe(true)
})
