import { Secp256k1 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const address = accounts[0].address
const privateKey = accounts[0].privateKey

test('behavior: verify w/ address', () => {
  const payload = '0xdeadbeef'
  const signature = Secp256k1.sign({ payload, privateKey })
  expect(Secp256k1.verify({ address, payload, signature })).toBe(true)
})

test('behavior: verify w/ publicKey', () => {
  const payload = '0xdeadbeef'
  const { r, s } = Secp256k1.sign({ payload, privateKey })
  const publicKey = Secp256k1.getPublicKey({ privateKey })
  expect(Secp256k1.verify({ publicKey, payload, signature: { r, s } })).toBe(
    true,
  )
})
