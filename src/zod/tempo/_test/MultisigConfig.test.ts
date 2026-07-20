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
  threshold: 1,
} as const

describe('Config', () => {
  test('accepts valid native multisig configurations', () => {
    expect(z.safeDecode(z_MultisigConfig.Config, config).success).toBe(true)
  })

  test('rejects configurations outside protocol limits', () => {
    expect(
      z.safeDecode(z_MultisigConfig.Config, {
        ...config,
        owners: [{ ...config.owners[0], weight: 9 }],
        threshold: 9,
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
