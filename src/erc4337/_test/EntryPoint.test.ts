import { EntryPoint } from 'ox/erc4337'
import { describe, expect, test } from 'vp/test'

describe('abiV09', () => {
  test('default', () => {
    const names = new Set([
      'EIP7702AccountInitialized',
      'IgnoredInitCode',
      'InvalidPaymasterSignatureLength',
      'getCurrentUserOpHash',
    ])

    expect(
      EntryPoint.abiV09
        .filter((item) => 'name' in item && names.has(item.name))
        .map((item) =>
          'name' in item ? { name: item.name, type: item.type } : item,
        ),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "InvalidPaymasterSignatureLength",
          "type": "error",
        },
        {
          "name": "EIP7702AccountInitialized",
          "type": "event",
        },
        {
          "name": "IgnoredInitCode",
          "type": "event",
        },
        {
          "name": "getCurrentUserOpHash",
          "type": "function",
        },
      ]
    `)
  })
})

describe('addressV09', () => {
  test('default', () => {
    expect(EntryPoint.addressV09).toMatchInlineSnapshot(
      `"0x433709009B8330FDa32311DF1C2AFA402eD8D009"`,
    )
  })
})
