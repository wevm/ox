import { Secp256k1 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const privateKey = accounts[0].privateKey

test('default', () => {
  const payload = '0xdeadbeef'
  const signature = Secp256k1.sign({ payload, privateKey })
  expect(Secp256k1.recoverPublicKey({ payload, signature })).toBe(
    Secp256k1.getPublicKey({ privateKey }),
  )
})

test('args: to', () => {
  const payload = '0xdeadbeef'
  const signature = Secp256k1.sign({ payload, privateKey })
  expect(
    Secp256k1.recoverPublicKey({ payload, signature, to: 'bytes' }),
  ).toStrictEqual(Secp256k1.getPublicKey({ privateKey, to: 'bytes' }))
})