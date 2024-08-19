import { expect, test } from 'vitest'

import { validateTypedData } from './validateTypedData.js'

test('default', () => {
  validateTypedData({
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
    validateTypedData({
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
  ).toThrowErrorMatchingInlineSnapshot(`
    [IntegerOutOfRangeError: Number \`-1\` is not in safe 8-bit unsigned integer range (\`0\` to \`255\`)

    See: https://oxlib.sh/errors#integeroutofrangeerror]
  `)
})

test('uint overflow', () => {
  expect(() =>
    validateTypedData({
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
  ).toThrowErrorMatchingInlineSnapshot(`
    [IntegerOutOfRangeError: Number \`256\` is not in safe 8-bit unsigned integer range (\`0\` to \`255\`)

    See: https://oxlib.sh/errors#integeroutofrangeerror]
  `)
})

test('int underflow', () => {
  expect(() =>
    validateTypedData({
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
  ).toThrowErrorMatchingInlineSnapshot(`
    [IntegerOutOfRangeError: Number \`-129\` is not in safe 8-bit signed integer range (\`-128\` to \`127\`)

    See: https://oxlib.sh/errors#integeroutofrangeerror]
  `)
})

test('invalid address', () => {
  expect(() =>
    validateTypedData({
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
    [InvalidAddressError: Address "0x000000000000000000000000000000000000z" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})

test('bytes size mismatch', () => {
  expect(() =>
    validateTypedData({
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
  ).toThrowErrorMatchingInlineSnapshot(`
    [BytesSizeMismatchError: Expected bytes32, got bytes20.

    See: https://oxlib.sh/bytessizemismatcherror]
  `)
})

test('domain: invalid chainId', () => {
  expect(() =>
    validateTypedData({
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
  ).toThrowErrorMatchingInlineSnapshot(`
    [IntegerOutOfRangeError: Number \`-1n\` is not in safe 256-bit unsigned integer range (\`0n\` to \`115792089237316195423570985008687907853269984665640564039457584007913129639935n\`)

    See: https://oxlib.sh/errors#integeroutofrangeerror]
  `)
})

test('domain: invalid contract', () => {
  expect(() =>
    validateTypedData({
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
    [InvalidAddressError: Address "0xCczCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})

test('EIP712Domain as primaryType', () => {
  validateTypedData({
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
    validateTypedData({
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
    [InvalidPrimaryTypeError: Invalid primary type \`Foo\` must be one of \`["EIP712Domain","Mail","Person"]\`.

    Check that the primary type is a key in \`types\`.

    See: https://oxlib.sh/errors#invalidprimarytypeerror]
  `)
})
