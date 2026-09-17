import { describe, expect, test } from 'vp/test'
import * as z_MultisigConfig from '../MultisigConfig.js'
import * as z from 'zod/mini'

const config = {
  owners: [
    {
      owner: '0x1111111111111111111111111111111111111111',
      weight: 1,
    },
  ],
  salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
  threshold: 1,
  version: 0n,
} as const

const rpc = { ...config, version: '0x0' } as const

describe('Config', () => {
  test('accepts valid native multisig configurations', () => {
    expect(z.safeDecode(z_MultisigConfig.Config, config).success).toBe(true)
  })

  test('round-trips RPC configurations', () => {
    const decoded = z.decode(z_MultisigConfig.MultisigConfig, rpc)

    expect(decoded).toEqual(config)
    expect(z.encode(z_MultisigConfig.MultisigConfig, decoded)).toEqual(rpc)
  })

  test('rejects configurations outside protocol limits', () => {
    expect(
      z.safeDecode(z_MultisigConfig.Config, {
        ...config,
        owners: [{ ...config.owners[0], weight: 255 }],
        threshold: 256,
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('rejects non-canonical owner order', () => {
    expect(
      z.safeDecode(z_MultisigConfig.Config, {
        ...config,
        owners: [
          {
            owner: '0x2222222222222222222222222222222222222222',
            weight: 1,
          },
          config.owners[0],
        ],
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })
})
