import { Authorization } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  {
    const tuple = Authorization.toTupleList([])
    expect(tuple).toMatchInlineSnapshot('[]')
  }

  {
    const authorization_1 = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    const authorization_2 = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 3,
      nonce: 20n,
    })
    const tuple = Authorization.toTupleList([authorization_1, authorization_2])
    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x01",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x28",
        ],
        [
          "0x03",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x14",
        ],
      ]
    `)
  }

  {
    const authorization_3 = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 5,
      nonce: 42n,
      r: 1n,
      s: 2n,
      yParity: 0,
    })
    const authorization_4 = Authorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 2,
      nonce: 43n,
      r: 4n,
      s: 5n,
      yParity: 0,
    })
    const tuple = Authorization.toTupleList([authorization_3, authorization_4])
    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x05",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x2a",
          "0x",
          "0x01",
          "0x02",
        ],
        [
          "0x02",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x2b",
          "0x",
          "0x04",
          "0x05",
        ],
      ]
    `)
  }
})
