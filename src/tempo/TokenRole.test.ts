import { Hash, Hex } from 'ox'
import { TokenRole } from 'ox/tempo'
import { expect, test } from 'vitest'

test('serialize', () => {
  TokenRole.roles.forEach((role) => {
    if (role === 'defaultAdmin')
      expect(TokenRole.serialize(role)).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      )
    else
      expect(TokenRole.serialize(role)).toBe(
        Hash.keccak256(Hex.fromString(TokenRole.toPreHashed[role])),
      )
  })
})
