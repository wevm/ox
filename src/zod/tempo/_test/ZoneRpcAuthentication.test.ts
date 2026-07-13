import { describe, expect, test } from 'vp/test'
import * as core_ZoneRpcAuthentication from '../../../tempo/ZoneRpcAuthentication.js'
import * as z_ZoneRpcAuthentication from '../ZoneRpcAuthentication.js'
import * as z from 'zod/mini'

const serialized =
  '0xa1dd6845847a5be6cd50198d1fe64520c7d06772c523db9d645943bccfb177d93449d13c8e31b418f9589ba2a9a1e127aa19bfd6944ab87250c282fb8d215baf1b000000001a00000000fb5a505a0000000065ff5e000000000065ff6058' as const

describe('ZoneRpcAuthentication', () => {
  test('decodes a serialized token', () => {
    expect(z.decode(z_ZoneRpcAuthentication.serialized, serialized)).toEqual(
      core_ZoneRpcAuthentication.deserialize(serialized),
    )
  })

  test('round-trips a serialized token via encode', () => {
    const decoded = z.decode(z_ZoneRpcAuthentication.serialized, serialized)
    expect(z.encode(z_ZoneRpcAuthentication.serialized, decoded)).toBe(
      serialized,
    )
  })

  test('validates an unsigned token', () => {
    const unsigned = {
      chainId: 4217000026,
      expiresAt: 1711235160,
      issuedAt: 1711234560,
      version: 0,
      zoneId: 26,
    } as const
    expect(
      z.safeDecode(z_ZoneRpcAuthentication.Unsigned, unsigned).success,
    ).toBe(true)
  })

  test('rejects an invalid version', () => {
    expect(
      z.safeDecode(z_ZoneRpcAuthentication.Unsigned, {
        chainId: 1,
        expiresAt: 1,
        issuedAt: 1,
        version: 1,
        zoneId: 1,
      } as never).success,
    ).toBe(false)
  })
})
