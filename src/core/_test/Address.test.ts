import { Address, PublicKey } from 'ox'
import { describe, expect, expectTypeOf, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(Address)).toMatchInlineSnapshot(`
    [
      "assert",
      "checksum",
      "from",
      "fromPublicKey",
      "isEqual",
      "validate",
      "InvalidAddressError",
      "InvalidInputError",
      "InvalidChecksumError",
    ]
  `)
})

describe('Address.assert', () => {
  test('default', () => {
    Address.assert('0x0000000000000000000000000000000000000000')
    Address.assert('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
  })

  test('options: parameter', () => {
    const parameter = { type: 'address', name: 'recipient' } as const

    expect(() => Address.assert('0xinvalid', { parameter })).toThrowError(
      expect.objectContaining({ parameter }),
    )

    expect(() =>
      Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac', {
        parameter,
      }),
    ).toThrowError(expect.objectContaining({ parameter }))
  })

  test('parameter is undefined by default', () => {
    expect(() => Address.assert('0xinvalid')).toThrowError(
      expect.objectContaining({ parameter: undefined }),
    )
  })

  test('error: invalid checksum', () => {
    expect(() =>
      Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac" is invalid.

    Details: Address does not match its checksum counterpart.]
  `)

    expect(() => Address.assert('x')).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "x" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)

    expect(() => Address.assert('0xa')).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)

    expect(() =>
      Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az'),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)

    expect(() =>
      Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff'),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)

    expect(() =>
      Address.assert('a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })
})

describe('Address.checksum', () => {
  test('checksums address', () => {
    Address.checksum('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
    expect(
      Address.checksum('0xa0cf798816d4b9b9866b5330eea46a18382f251e'),
    ).toMatchInlineSnapshot('"0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"')
    expect(
      Address.checksum('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'),
    ).toMatchInlineSnapshot('"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"')
    expect(
      Address.checksum('0x70997970c51812dc3a010c7d01b50e0d17dc79c8'),
    ).toMatchInlineSnapshot('"0x70997970C51812dc3A010C7d01b50e0d17dc79C8"')
    expect(
      Address.checksum('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'),
    ).toMatchInlineSnapshot('"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"')
    expect(
      Address.checksum('0x90f79bf6eb2c4f870365e785982e1f101e93b906'),
    ).toMatchInlineSnapshot('"0x90F79bf6EB2c4f870365E785982E1f101E93b906"')
    expect(
      Address.checksum('0x15d34aaf54267db7d7c367839aaf71a00a2c6a65'),
    ).toMatchInlineSnapshot('"0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"')
    expect(
      Address.checksum('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
    ).toMatchInlineSnapshot(`"0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC"`)
  })
})

describe('Address.from', () => {
  test('default', () => {
    const address = Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
    expectTypeOf(address).toEqualTypeOf<Address.Address>()
    expect(address).toMatchInlineSnapshot(
      `"0xa0cf798816d4b9b9866b5330eea46a18382f251e"`,
    )
  })

  test('options: checksum', () => {
    expect(
      Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e', {
        checksum: false,
      }),
    ).toMatchInlineSnapshot(`"0xa0cf798816d4b9b9866b5330eea46a18382f251e"`)
  })

  test('error: invalid address input', () => {
    expect(() => Address.from('0xa')).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })

  test('error: invalid address checksum', () => {
    expect(() =>
      Address.from('0xA0Cf798816D4b9b9866b5330Eea46a18382f251e'),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xA0Cf798816D4b9b9866b5330Eea46a18382f251e" is invalid.

    Details: Address does not match its checksum counterpart.]
  `)
  })
})

describe('Address.fromPublicKey', () => {
  test('default', () => {
    expect(
      Address.fromPublicKey(
        PublicKey.from(
          '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
        ),
      ),
    ).toEqual('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')

    expect(
      Address.fromPublicKey(
        PublicKey.from(
          '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
        ),
        { checksum: true },
      ),
    ).toEqual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  })
})

describe('Address.isEqual', () => {
  test('default', () => {
    expect(
      Address.isEqual(
        '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
        '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
      ),
    ).toBeTruthy()
    expect(
      Address.isEqual(
        '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
        '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
      ),
    ).toBeTruthy()
    expect(
      Address.isEqual(
        '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
        '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
      ),
    ).toBeTruthy()
    expect(
      Address.isEqual(
        '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
        '0xA0Cf798816D4b9b9866b5330EEa46a18382f251f',
      ),
    ).toBeFalsy()
  })

  test('error: invalid address', () => {
    expect(() =>
      Address.isEqual(
        '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az',
        '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
    expect(() =>
      Address.isEqual(
        '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac',
        '0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })
})

describe('Address.validate', () => {
  test('checks if address is valid', () => {
    expect(
      Address.validate('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
    ).toBeFalsy()
    expect(Address.validate('x')).toBeFalsy()
    expect(Address.validate('0xa')).toBeFalsy()
    expect(
      Address.validate('0xa0cf798816d4b9b9866b5330eea46a18382f251e'),
    ).toBeTruthy()
    expect(
      Address.validate('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az'),
    ).toBeFalsy()
    expect(
      Address.validate('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff'),
    ).toBeFalsy()
    expect(
      Address.validate('a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
    ).toBeFalsy()
  })
})

test('InvalidAddressError', () => {
  {
    const error = new Address.InvalidAddressError({
      address: '0x1234567890123456789012345678901234567890',
      cause: new Address.InvalidChecksumError(),
    })
    expect(error.message).toMatchInlineSnapshot(
      `
      "Address "0x1234567890123456789012345678901234567890" is invalid.

      Details: Address does not match its checksum counterpart."
    `,
    )
  }

  {
    const error = new Address.InvalidAddressError({
      address: '0x1234567890123456789012345678901234567890',
      cause: new Address.InvalidInputError(),
    })
    expect(error.message).toMatchInlineSnapshot(
      `
      "Address "0x1234567890123456789012345678901234567890" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value."
    `,
    )
  }
})
