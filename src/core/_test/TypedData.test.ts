import { Hex, TypedData } from 'ox'
import { describe, expect, test } from 'vitest'
import * as typedData from '../../../test/constants/typedData.js'

describe('assert', () => {
  test('default', () => {
    TypedData.assert({
      domain: {
        name: 'Ether!',
        version: '1',
        chainId: 1n,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    })
  })

  test('negative uint', () => {
    expect(() =>
      TypedData.assert({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'favoriteNumber', type: 'uint8' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            favoriteNumber: -1,
          },
          to: {
            name: 'Bob',
            favoriteNumber: -50,
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-1` is not in safe 8-bit unsigned integer range (`0` to `255`)]',
    )
  })

  test('uint overflow', () => {
    expect(() =>
      TypedData.assert({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'favoriteNumber', type: 'uint8' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            favoriteNumber: 256,
          },
          to: {
            name: 'Bob',
            favoriteNumber: 0,
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `256` is not in safe 8-bit unsigned integer range (`0` to `255`)]',
    )
  })

  test('int underflow', () => {
    expect(() =>
      TypedData.assert({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'favoriteNumber', type: 'int8' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            favoriteNumber: -129,
          },
          to: {
            name: 'Bob',
            favoriteNumber: 0,
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-129` is not in safe 8-bit signed integer range (`-128` to `127`)]',
    )
  })

  test('invalid address', () => {
    expect(() =>
      TypedData.assert({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            wallet: '0x0000000000000000000000000000000000000000',
          },
          to: {
            name: 'Bob',
            wallet: '0x000000000000000000000000000000000000z',
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x000000000000000000000000000000000000z" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)
  })

  test('bytes size mismatch', () => {
    expect(() =>
      TypedData.assert({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'hash', type: 'bytes32' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            hash: '0x0000000000000000000000000000000000000000',
          },
          to: {
            name: 'Bob',
            hash: '0x0000000000000000000000000000000000000000',
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TypedData.BytesSizeMismatchError: Expected bytes32, got bytes20.]',
    )
  })

  test('domain: invalid', () => {
    expect(() =>
      TypedData.assert({
        domain: 'foo' as never,
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [TypedData.InvalidDomainError: Invalid domain ""foo"".

      Must be a valid EIP-712 domain.]
    `,
    )
  })

  test('domain: invalid chainId', () => {
    expect(() =>
      TypedData.assert({
        domain: {
          name: 'Ether!',
          version: '1',
          chainId: -1n,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Hex.IntegerOutOfRangeError: Number `-1n` is not in safe 256-bit unsigned integer range (`0n` to `115792089237316195423570985008687907853269984665640564039457584007913129639935n`)]',
    )
  })

  test('domain: invalid contract', () => {
    expect(() =>
      TypedData.assert({
        domain: {
          name: 'Ether!',
          version: '1',
          chainId: 1n,
          verifyingContract: '0xCczCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0xCczCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)
  })

  test('EIP712Domain as primaryType', () => {
    TypedData.assert({
      domain: {
        name: 'Ether!',
        version: '1',
        chainId: 1n,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'EIP712Domain',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
    })
  })

  test('primaryType: does not exist in types', () => {
    expect(() =>
      TypedData.assert({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'hash', type: 'bytes32' },
          ],
        },
        // @ts-expect-error
        primaryType: 'Foo',
        message: {
          from: {
            name: 'Cow',
            hash: '0x0000000000000000000000000000000000000000',
          },
          to: {
            name: 'Bob',
            hash: '0x0000000000000000000000000000000000000000',
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TypedData.InvalidPrimaryTypeError: Invalid primary type \`Foo\` must be one of \`["EIP712Domain","Mail","Person"]\`.

      Check that the primary type is a key in \`types\`.]
    `)
  })

  test('struct type not valid', () => {
    expect(() =>
      TypedData.assert({
        types: {
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'address', type: 'address' },
          ],
          address: [],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            address: '0x0000000000000000000000000000000000000000',
          },
          to: {
            name: 'Bob',
            address: '0x0000000000000000000000000000000000000000',
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TypedData.InvalidStructTypeError: Struct type "address" is invalid.

      Struct type must not be a Solidity type.]
    `)
  })
})

describe('domainSeparator', () => {
  test('default', () => {
    expect(
      TypedData.domainSeparator(typedData.basic.domain),
    ).toMatchInlineSnapshot(
      `"0x2fdf3441fcaf4f30c7e16292b258a5d7054a4e2e00dbd7b7d2f467f2b8fb9413"`,
    )
  })
})

describe('encode', () => {
  test('default', () => {
    expect(
      TypedData.encode({
        ...typedData.basic,
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x19012fdf3441fcaf4f30c7e16292b258a5d7054a4e2e00dbd7b7d2f467f2b8fb9413c52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e"`,
    )
  })

  test('complex', () => {
    expect(
      TypedData.encode({
        ...typedData.complex,
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x19011788ede5301fb0c4b95dda42eabe811ba83dc3cde96087b00c9b72a4d26a379ac2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
    )
  })

  test('no domain', () => {
    expect(
      TypedData.encode({
        ...typedData.complex,
        domain: undefined,
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x19016192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1c2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
    )
    expect(
      TypedData.encode({
        ...typedData.complex,
        domain: {},
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x19016192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1c2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
    )
  })

  test('domain: empty name', () => {
    expect(
      TypedData.encode({
        ...typedData.complex,
        domain: { name: '' },
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x190196d6b4b58ef5c06dfaf375adc42ff615f90c055921386f4140a4c91caa786a91c2972c4c4323c6d7ee73e319350f290c6549b6eb516b5e535412841334233215"`,
    )
  })

  test('minimal valid typed message', () => {
    const encoded = TypedData.encode({
      types: {
        EIP712Domain: [],
      },
      primaryType: 'EIP712Domain',
      domain: {},
    })

    expect(encoded).toMatchInlineSnapshot(
      `"0x19016192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1"`,
    )
  })

  test('typed message with a domain separator that uses all fields.', () => {
    const encoded = TypedData.encode({
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
      },
      primaryType: 'EIP712Domain',
      domain: {
        name: 'example.metamask.io',
        version: '1',
        chainId: 1n,
        verifyingContract: '0x0000000000000000000000000000000000000000',
        salt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
      },
    })

    expect(encoded).toMatchInlineSnapshot(
      `"0x190162d1d3234124be639f11bfcb3c421b50cc645b88e2aca76f3a6ddf860a94e5b1"`,
    )
  })

  test('typed message with only custom domain separator fields', () => {
    const encoded = TypedData.encode({
      types: {
        EIP712Domain: [
          {
            name: 'customName',
            type: 'string',
          },
          {
            name: 'customVersion',
            type: 'string',
          },
          {
            name: 'customChainId',
            type: 'uint256',
          },
          {
            name: 'customVerifyingContract',
            type: 'address',
          },
          {
            name: 'customSalt',
            type: 'bytes32',
          },
          {
            name: 'extraField',
            type: 'string',
          },
        ],
      },
      primaryType: 'EIP712Domain',
      domain: {
        customName: 'example.metamask.io',
        customVersion: '1',
        customChainId: 1n,
        customVerifyingContract: '0x0000000000000000000000000000000000000000',
        customSalt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
        extraField: 'stuff',
      },
    })

    expect(encoded).toMatchInlineSnapshot(
      `"0x1901e4e2a795578f2e89fbd7a0b67e17df4b7791a6c47054b423ea27f1076f56bd4a"`,
    )
  })

  test('typed message with data', () => {
    const encoded = TypedData.encode({
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
        Message: [{ name: 'data', type: 'string' }],
      },
      primaryType: 'Message',
      domain: {
        name: 'example.metamask.io',
        version: '1',
        chainId: 1n,
        verifyingContract: '0x0000000000000000000000000000000000000000',
        salt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
      },
      message: {
        data: 'Hello!',
      },
    })

    expect(encoded).toMatchInlineSnapshot(
      `"0x190162d1d3234124be639f11bfcb3c421b50cc645b88e2aca76f3a6ddf860a94e5b115d2c54cdaa22a6a3a8dbd89086b2ffcf0853857db9bcf1541765a8f769a63ba"`,
    )
  })
})

describe('encodeType', () => {
  test('default', () => {
    expect(
      TypedData.encodeType({
        ...typedData.basic,
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"Mail(Person from,Person to,string contents)Person(string name,address wallet)"`,
    )
  })
})

describe('extractEip712DomainTypes', () => {
  const FULL_DOMAIN = {
    name: 'example.metamask.io',
    version: '1',
    chainId: 1,
    verifyingContract: '0x0000000000000000000000000000000000000000',
    salt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
  } as const

  test('basic', () => {
    expect(
      TypedData.extractEip712DomainTypes(FULL_DOMAIN),
    ).toMatchInlineSnapshot(`
    [
      {
        "name": "name",
        "type": "string",
      },
      {
        "name": "version",
        "type": "string",
      },
      {
        "name": "chainId",
        "type": "uint256",
      },
      {
        "name": "verifyingContract",
        "type": "address",
      },
      {
        "name": "salt",
        "type": "bytes32",
      },
    ]
  `)
  })

  test('partial', () => {
    expect(
      TypedData.extractEip712DomainTypes({
        ...FULL_DOMAIN,
        name: undefined,
        version: undefined,
      }),
    ).toMatchInlineSnapshot(`
    [
      {
        "name": "chainId",
        "type": "uint256",
      },
      {
        "name": "verifyingContract",
        "type": "address",
      },
      {
        "name": "salt",
        "type": "bytes32",
      },
    ]
  `)
  })

  test('empty', () => {
    expect(TypedData.extractEip712DomainTypes({})).toMatchInlineSnapshot('[]')
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    expect(
      TypedData.getSignPayload({
        ...typedData.basic,
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x448f54762ef8ecccdc4d19bb7d467161383cd4b271617a8cee05c790eb745d74"`,
    )
  })

  test('complex', () => {
    expect(
      TypedData.getSignPayload({
        ...typedData.complex,
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x9a74cb859ad30835ffb2da406423233c212cf6dd78e6c2c98b0c9289568954ae"`,
    )
  })

  test('no domain', () => {
    expect(
      TypedData.getSignPayload({
        ...typedData.complex,
        domain: undefined,
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x14ed1dbbfecbe5de3919f7ea47daafdf3a29dfbb60dd88d85509f79773d503a5"`,
    )
    expect(
      TypedData.getSignPayload({
        ...typedData.complex,
        domain: {},
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0x14ed1dbbfecbe5de3919f7ea47daafdf3a29dfbb60dd88d85509f79773d503a5"`,
    )
  })

  test('domain: empty name', () => {
    expect(
      TypedData.getSignPayload({
        ...typedData.complex,
        domain: { name: '' },
        primaryType: 'Mail',
      }),
    ).toMatchInlineSnapshot(
      `"0xc3f4f9ebd774352940f60aebbc83fcee20d0b17eb42bd1b20c91a748001ecb53"`,
    )
  })

  test('domain: bigint chainId produces same hash as number chainId', () => {
    const typedDataWithNumberChainId = {
      domain: {
        name: 'Test',
        version: '1',
        chainId: 1,
        verifyingContract: '0x0000000000000000000000000000000000000000',
      },
      types: {
        Message: [{ name: 'content', type: 'string' }],
      },
      primaryType: 'Message',
      message: {
        content: 'Hello World',
      },
    } as const

    const typedDataWithBigintChainId = {
      ...typedDataWithNumberChainId,
      domain: {
        ...typedDataWithNumberChainId.domain,
        chainId: 1n,
      },
    }

    const hashWithNumber = TypedData.getSignPayload(typedDataWithNumberChainId)
    const hashWithBigint = TypedData.getSignPayload(typedDataWithBigintChainId)

    expect(hashWithNumber).toBe(hashWithBigint)
  })

  test('minimal valid typed message', () => {
    const payload = TypedData.getSignPayload({
      types: {
        EIP712Domain: [],
      },
      primaryType: 'EIP712Domain',
      domain: {},
    })

    expect(payload).toMatchInlineSnapshot(
      `"0x8d4a3f4082945b7879e2b55f181c31a77c8c0a464b70669458abbaaf99de4c38"`,
    )
  })

  test('typed message with a domain separator that uses all fields.', () => {
    const payload = TypedData.getSignPayload({
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
      },
      primaryType: 'EIP712Domain',
      domain: {
        name: 'example.metamask.io',
        version: '1',
        chainId: 1n,
        verifyingContract: '0x0000000000000000000000000000000000000000',
        salt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
      },
    })

    expect(payload).toMatchInlineSnapshot(
      `"0x54ffed5209a17ac210ef3823740b3852ee9cd518b84ee39f0a3fa7f2f9b4205b"`,
    )
  })

  test('typed message with only custom domain separator fields', () => {
    const payload = TypedData.getSignPayload({
      types: {
        EIP712Domain: [
          {
            name: 'customName',
            type: 'string',
          },
          {
            name: 'customVersion',
            type: 'string',
          },
          {
            name: 'customChainId',
            type: 'uint256',
          },
          {
            name: 'customVerifyingContract',
            type: 'address',
          },
          {
            name: 'customSalt',
            type: 'bytes32',
          },
          {
            name: 'extraField',
            type: 'string',
          },
        ],
      },
      primaryType: 'EIP712Domain',
      domain: {
        customName: 'example.metamask.io',
        customVersion: '1',
        customChainId: 1n,
        customVerifyingContract: '0x0000000000000000000000000000000000000000',
        customSalt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
        extraField: 'stuff',
      },
    })

    expect(payload).toMatchInlineSnapshot(
      `"0x3efa3ef0305f56ba5bba62000500e29fe82c5314bca2f958c64e31b2498560f8"`,
    )
  })

  test('typed message with data', () => {
    const payload = TypedData.getSignPayload({
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
        Message: [{ name: 'data', type: 'string' }],
      },
      primaryType: 'Message',
      domain: {
        name: 'example.metamask.io',
        version: '1',
        chainId: 1n,
        verifyingContract: '0x0000000000000000000000000000000000000000',
        salt: Hex.padRight(Hex.fromBytes(new Uint8Array([1, 2, 3]))),
      },
      message: {
        data: 'Hello!',
      },
    })

    expect(payload).toMatchInlineSnapshot(
      `"0xd2669f23b7849020ad41bcbff5b51372793f91320e0f901641945568ed7322be"`,
    )
  })
})

describe('hashDomain', () => {
  test('default', () => {
    expect(
      TypedData.hashDomain({
        ...typedData.basic,
        domain: typedData.basic.domain,
      }),
    ).toMatchInlineSnapshot(
      `"0x2fdf3441fcaf4f30c7e16292b258a5d7054a4e2e00dbd7b7d2f467f2b8fb9413"`,
    )
  })
})

describe('hashStruct', () => {
  test('default', () => {
    expect(
      TypedData.hashStruct({
        ...typedData.basic,
        primaryType: 'Mail',
        data: typedData.basic.message,
      }),
    ).toMatchInlineSnapshot(
      `"0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e"`,
    )
  })
})

describe('serialize', () => {
  test('default', () => {
    expect(
      TypedData.serialize({
        domain: {
          name: 'Ether!',
          version: '1',
          chainId: 1,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'Foo',
        types: {
          Foo: [
            { name: 'address', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'foo', type: 'string' },
          ],
        },
        message: {
          address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
          name: 'jxom',
          foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        },
      }),
    ).toMatchInlineSnapshot(
      `"{"domain":{"name":"Ether!","version":"1","chainId":1,"verifyingContract":"0xcccccccccccccccccccccccccccccccccccccccc"},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9"},"primaryType":"Foo","types":{"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"`,
    )
  })

  test('with domain', () => {
    expect(
      TypedData.serialize({
        domain: {
          name: 'Ether!',
          version: '1',
          address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
          chainId: 1,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'Foo',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'address', type: 'address' },
            { name: 'chainId', type: 'uint32' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Foo: [
            { name: 'address', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'foo', type: 'string' },
          ],
        },
        message: {
          address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
          name: 'jxom',
          foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
        },
      }),
    ).toMatchInlineSnapshot(
      `"{"domain":{"name":"Ether!","version":"1","address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","chainId":1,"verifyingContract":"0xcccccccccccccccccccccccccccccccccccccccc"},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9"},"primaryType":"Foo","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"address","type":"address"},{"name":"chainId","type":"uint32"},{"name":"verifyingContract","type":"address"}],"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"`,
    )
  })

  test('domain as primary type', () => {
    expect(
      TypedData.serialize({
        domain: {
          name: 'Ether!',
          version: '1',
          address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
          chainId: 1,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'EIP712Domain',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'address', type: 'address' },
            { name: 'chainId', type: 'uint32' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Foo: [
            { name: 'address', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'foo', type: 'string' },
          ],
        },
      }),
    ).toMatchInlineSnapshot(
      `"{"domain":{"name":"Ether!","version":"1","address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","chainId":1,"verifyingContract":"0xcccccccccccccccccccccccccccccccccccccccc"},"primaryType":"EIP712Domain","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"address","type":"address"},{"name":"chainId","type":"uint32"},{"name":"verifyingContract","type":"address"}],"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"`,
    )
  })

  test('no domain', () => {
    expect(
      TypedData.serialize({
        primaryType: 'Foo',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint32' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Foo: [
            { name: 'address', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'foo', type: 'string' },
            { name: 'a', type: 'uint32' },
            { name: 'b', type: 'uint256' },
          ],
        },
        message: {
          address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
          name: 'jxom',
          foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
          a: 1,
          b: 420420420420420420420420420420420420420420n,
        },
      }),
    ).toMatchInlineSnapshot(
      `"{"domain":{},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9","a":1,"b":"420420420420420420420420420420420420420420"},"primaryType":"Foo","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint32"},{"name":"verifyingContract","type":"address"}],"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"},{"name":"a","type":"uint32"},{"name":"b","type":"uint256"}]}}"`,
    )
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      TypedData.validate({
        domain: {
          name: 'Ether!',
          version: '1',
          chainId: 1n,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    ).toBe(true)
  })

  test('negative uint', () => {
    expect(
      TypedData.validate({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'favoriteNumber', type: 'uint8' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            favoriteNumber: -1,
          },
          to: {
            name: 'Bob',
            favoriteNumber: -50,
          },
        },
      }),
    ).toBe(false)
  })

  test('uint overflow', () => {
    expect(
      TypedData.validate({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'favoriteNumber', type: 'uint8' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            favoriteNumber: 256,
          },
          to: {
            name: 'Bob',
            favoriteNumber: 0,
          },
        },
      }),
    ).toBe(false)
  })

  test('int underflow', () => {
    expect(
      TypedData.validate({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'favoriteNumber', type: 'int8' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            favoriteNumber: -129,
          },
          to: {
            name: 'Bob',
            favoriteNumber: 0,
          },
        },
      }),
    ).toBe(false)
  })

  test('invalid address', () => {
    expect(
      TypedData.validate({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            wallet: '0x0000000000000000000000000000000000000000',
          },
          to: {
            name: 'Bob',
            wallet: '0x000000000000000000000000000000000000z',
          },
        },
      }),
    ).toBe(false)
  })

  test('bytes size mismatch', () => {
    expect(
      TypedData.validate({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'hash', type: 'bytes32' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            hash: '0x0000000000000000000000000000000000000000',
          },
          to: {
            name: 'Bob',
            hash: '0x0000000000000000000000000000000000000000',
          },
        },
      }),
    ).toBe(false)
  })

  test('domain: invalid chainId', () => {
    expect(
      TypedData.validate({
        domain: {
          name: 'Ether!',
          version: '1',
          chainId: -1n,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    ).toBe(false)
  })

  test('domain: invalid contract', () => {
    expect(
      TypedData.validate({
        domain: {
          name: 'Ether!',
          version: '1',
          chainId: 1n,
          verifyingContract: '0xCczCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
    ).toBe(false)
  })

  test('EIP712Domain as primaryType', () => {
    expect(
      TypedData.validate({
        domain: {
          name: 'Ether!',
          version: '1',
          chainId: 1n,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        primaryType: 'EIP712Domain',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
      }),
    ).toBe(true)
  })

  test('primaryType: does not exist in types', () => {
    expect(
      TypedData.validate({
        types: {
          EIP712Domain: [],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'hash', type: 'bytes32' },
          ],
        },
        // @ts-expect-error
        primaryType: 'Foo',
        message: {
          from: {
            name: 'Cow',
            hash: '0x0000000000000000000000000000000000000000',
          },
          to: {
            name: 'Bob',
            hash: '0x0000000000000000000000000000000000000000',
          },
        },
      }),
    ).toBe(false)
  })
})

test('BytesSizeMismatchError', () => {
  expect(
    new TypedData.BytesSizeMismatchError({
      expectedSize: 69,
      givenSize: 420,
    }),
  ).toMatchInlineSnapshot(
    '[TypedData.BytesSizeMismatchError: Expected bytes69, got bytes420.]',
  )
})

test('InvalidPrimaryTypeError', () => {
  expect(
    new TypedData.InvalidPrimaryTypeError({
      primaryType: 'Boo',
      types: typedData.complex.types,
    }),
  ).toMatchInlineSnapshot(`
    [TypedData.InvalidPrimaryTypeError: Invalid primary type \`Boo\` must be one of \`["Name","Person","Mail"]\`.

    Check that the primary type is a key in \`types\`.]
  `)
})

test('exports', () => {
  expect(Object.keys(TypedData)).toMatchInlineSnapshot(`
    [
      "assert",
      "domainSeparator",
      "encode",
      "encodeType",
      "extractEip712DomainTypes",
      "getSignPayload",
      "hashDomain",
      "hashStruct",
      "serialize",
      "validate",
      "BytesSizeMismatchError",
      "InvalidDomainError",
      "InvalidPrimaryTypeError",
      "InvalidStructTypeError",
      "encodeData",
      "hashType",
      "encodeField",
      "findTypeDependencies",
    ]
  `)
})
