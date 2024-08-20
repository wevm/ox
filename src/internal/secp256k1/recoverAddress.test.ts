import { expect, test } from 'vitest'
import { Address, Secp256k1 } from 'ox'
import { accounts } from '../../../test/constants/accounts.js'

const address = accounts[0].address
const privateKey = accounts[0].privateKey

test('default', () => {
  const payload = '0xdeadbeef'
  const signature = Secp256k1.sign({ payload, privateKey })
  expect(Secp256k1.recoverAddress({ payload, signature })).toBe(
    Address.from(address),
  )
})
