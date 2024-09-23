import { Address, HdKey, Mnemonic } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const seed = Mnemonic.toSeed(
  'test test test test test test test test test test test junk',
)
const extendedKey = HdKey.fromSeed(seed).privateExtendedKey

test('default', () => {
  const hdKey = HdKey.fromExtendedKey(extendedKey).derive(HdKey.path())
  expect(hdKey.privateKey!).toBe(accounts[0].privateKey)
  expect(Address.fromPublicKey(hdKey.publicKey)).toBe(accounts[0].address)
})

test('options: path', () => {
  for (let index = 0; index < accounts.length; index++) {
    const hdKey = HdKey.fromExtendedKey(extendedKey).derive(
      HdKey.path({ index }),
    )
    expect(Address.fromPublicKey(hdKey.publicKey)).toBe(
      accounts[index]!.address,
    )
  }
})
