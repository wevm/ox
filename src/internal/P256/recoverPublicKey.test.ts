import { P256 } from 'ox'
import { expect, test } from 'vitest'

const privateKey = P256.randomPrivateKey()

test('default', () => {
  const payload = '0xdeadbeef'
  const signature = P256.sign({ payload, privateKey })
  expect(P256.recoverPublicKey({ payload, signature })).toBe(
    P256.getPublicKey({ privateKey }),
  )
})

test('args: as', () => {
  const payload = '0xdeadbeef'
  const signature = P256.sign({ payload, privateKey })
  expect(
    P256.recoverPublicKey({ payload, signature, as: 'Bytes' }),
  ).toStrictEqual(P256.getPublicKey({ privateKey, as: 'Bytes' }))
})
