import { Authorization } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const authorization = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    const tuple = Authorization.toTuple(authorization)
    expect(tuple).toMatchInlineSnapshot(`
    [
      "0x01",
      "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
      "0x28",
    ]
  `)
  }

  {
    const authorization = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
      r: 1n,
      s: 2n,
      yParity: 0,
    })
    const tuple = Authorization.toTuple(authorization)
    expect(tuple).toMatchInlineSnapshot(`
      [
        "0x01",
        "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "0x28",
        "0x",
        "0x01",
        "0x02",
      ]
    `)
  }

  {
    const authorization = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 0,
      nonce: 0n,
    })
    const tuple = Authorization.toTuple(authorization)
    expect(tuple).toMatchInlineSnapshot(`
      [
        "0x",
        "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "0x",
      ]
    `)
  }
})
