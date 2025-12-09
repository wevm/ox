import { Attribution } from 'ox/erc8021'
import { describe, expect, test } from 'vitest'

describe('getSchemaId', () => {
  test('returns 0 for canonical registry (no codeRegistry)', () => {
    const schemaId = Attribution.getSchemaId({
      codes: ['baseapp'],
    })

    expect(schemaId).toBe(0)
  })

  test('returns 0 for canonical registry (explicit id: 0)', () => {
    const schemaId = Attribution.getSchemaId({
      codes: ['baseapp'],
      id: 0,
    })

    expect(schemaId).toBe(0)
  })

  test('returns 1 for custom registry', () => {
    const schemaId = Attribution.getSchemaId({
      codes: ['baseapp'],
      codeRegistry: {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        chainId: 1,
      },
    })

    expect(schemaId).toBe(1)
  })

  test('returns 1 for custom registry (explicit id: 1)', () => {
    const schemaId = Attribution.getSchemaId({
      codes: ['baseapp'],
      codeRegistry: {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        chainId: 1,
      },
      id: 1,
    })

    expect(schemaId).toBe(1)
  })
})

describe('toDataSuffix', () => {
  describe('schema 0 (canonical registry)', () => {
    test('single code', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['baseapp'],
      })

      // Expected: 'baseapp' (7 bytes) + length (1 byte: 0x07) + schema id (1 byte: 0x00) + erc suffix (16 bytes)
      // 'baseapp' = 0x626173656170702c
      expect(suffix).toBe(
        '0x62617365617070070080218021802180218021802180218021',
      )
    })

    test('multiple codes', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['baseapp', 'morpho'],
      })

      // Expected: 'baseapp,morpho' (14 bytes) + length (1 byte: 0x0e) + schema id (1 byte: 0x00) + erc suffix (16 bytes)
      // 'baseapp,morpho' = 0x626173656170702c6d6f7270686f (14 bytes)
      expect(suffix).toBe(
        '0x626173656170702c6d6f7270686f0e0080218021802180218021802180218021',
      )
    })

    test('explicit id', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['test'],
        id: 0,
      })

      // Expected: 'test' (4 bytes) + length (1 byte: 0x04) + schema id (1 byte: 0x00) + erc suffix (16 bytes)
      expect(suffix).toBe('0x74657374040080218021802180218021802180218021')
    })

    test('three codes', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['base', 'uniswap', 'cowswap'],
      })

      // 'base,uniswap,cowswap' = 20 bytes
      expect(suffix).toMatchInlineSnapshot(
        `"0x626173652c756e69737761702c636f7773776170140080218021802180218021802180218021"`,
      )
    })

    test('single character code', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['a'],
      })

      // 'a' = 1 byte
      expect(suffix).toMatchInlineSnapshot(
        `"0x61010080218021802180218021802180218021"`,
      )
    })

    test('codes with numbers', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['app123', 'test456'],
      })

      // 'app123,test456' = 14 bytes
      expect(suffix).toMatchInlineSnapshot(
        `"0x6170703132332c746573743435360e0080218021802180218021802180218021"`,
      )
    })

    test('codes with special characters', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['app-name', 'test_code'],
      })

      // 'app-name,test_code' = 18 bytes
      expect(suffix).toMatchInlineSnapshot(
        `"0x6170702d6e616d652c746573745f636f6465120080218021802180218021802180218021"`,
      )
    })

    test('empty codes array', () => {
      const suffix = Attribution.toDataSuffix({
        codes: [],
      })

      // '' = 0 bytes
      expect(suffix).toMatchInlineSnapshot(
        `"0x000080218021802180218021802180218021"`,
      )
    })

    test('codes with mixed case preserved', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['BaseApp', 'MorphoProtocol'],
      })

      // 'BaseApp,MorphoProtocol' = 22 bytes
      expect(suffix).toMatchInlineSnapshot(
        `"0x426173654170702c4d6f7270686f50726f746f636f6c160080218021802180218021802180218021"`,
      )
    })

    test('spec example: single entity', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['baseapp'],
        id: 0,
      })

      // Expected segment after txData (0xdddddddd)
      // 'baseapp' (7 bytes) + length (0x07) + schema ID (0x00) + ERC suffix
      expect(suffix).toBe(
        '0x62617365617070070080218021802180218021802180218021',
      )
    })
  })

  describe('schema 1 (custom registry)', () => {
    test('single code', () => {
      const input = {
        codes: ['baseapp'],
        codeRegistry: {
          address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const,
          chainId: 1,
        },
        id: 1 as const,
      }
      const suffix = Attribution.toDataSuffix(input)
      const parsed = Attribution.fromData(
        `0xdddddddd${suffix.slice(2)}` as const,
      )
      expect(parsed).toEqual({
        codes: ['baseapp'],
        codeRegistry: {
          address: input.codeRegistry.address.toLowerCase(),
          chainId: 1,
        },
        id: 1,
      })
    })

    test('multiple codes', () => {
      const input = {
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const,
          chainId: 8453,
        },
        id: 1 as const,
      }
      const suffix = Attribution.toDataSuffix(input)
      const parsed = Attribution.fromData(
        `0xeeeeeeee${suffix.slice(2)}` as const,
      )
      expect(parsed).toEqual({
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: input.codeRegistry.address.toLowerCase(),
          chainId: 8453,
        },
        id: 1,
      })
    })

    test('single character code', () => {
      const input = {
        codes: ['x'],
        codeRegistry: {
          address: '0x1234567890123456789012345678901234567890' as const,
          chainId: 10,
        },
        id: 1 as const,
      }
      const suffix = Attribution.toDataSuffix(input)
      const parsed = Attribution.fromData(
        `0xcccccccc${suffix.slice(2)}` as const,
      )
      expect(parsed).toEqual({
        codes: ['x'],
        codeRegistry: {
          address: input.codeRegistry.address.toLowerCase(),
          chainId: 10,
        },
        id: 1,
      })
    })

    test('long codes', () => {
      const input = {
        codes: ['verylongapplicationname', 'anotherlongcode'],
        codeRegistry: {
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const,
          chainId: 42161,
        },
        id: 1 as const,
      }
      const suffix = Attribution.toDataSuffix(input)
      const parsed = Attribution.fromData(
        `0xbbbbbbbb${suffix.slice(2)}` as const,
      )
      expect(parsed).toEqual({
        codes: ['verylongapplicationname', 'anotherlongcode'],
        codeRegistry: {
          address: input.codeRegistry.address.toLowerCase(),
          chainId: 42161,
        },
        id: 1,
      })
    })

    test('spec example: multiple entities', () => {
      const input = {
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xcccccccccccccccccccccccccccccccccccccccc' as const,
          chainId: 1,
        },
        id: 1 as const,
      }
      const suffix = Attribution.toDataSuffix(input)
      const parsed = Attribution.fromData(
        `0xdddddddd${suffix.slice(2)}` as const,
      )
      expect(parsed).toEqual({
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: input.codeRegistry.address.toLowerCase(),
          chainId: 1,
        },
        id: 1,
      })
    })
  })
})

describe('fromData', () => {
  describe('schema 0 (canonical registry)', () => {
    test('single entity', () => {
      // Input: transaction data + 'baseapp' (7 bytes) + length (0x07) + schema ID (0x00) + ERC suffix
      const input =
        '0xdddddddd62617365617070070080218021802180218021802180218021'

      const result = Attribution.fromData(input)

      expect(result).toEqual({
        codes: ['baseapp'],
        id: 0,
      })
    })

    test('empty codes', () => {
      // Input: transaction data + empty codes (0 bytes) + length (0x00) + schema ID (0x00) + ERC suffix
      const input = '0xdddddddd000080218021802180218021802180218021'

      const result = Attribution.fromData(input)

      // Empty string splits to [''] not []
      expect(result).toEqual({
        codes: [],
        id: 0,
      })
    })

    test.each([
      [['baseapp']],
      [['baseapp', 'morpho']],
      [['baseapp', 'morpho', 'uniswap']],
    ])('roundtrip{codes=%s}', (codes) => {
      const original: Attribution.Attribution = {
        codes: codes,
      }

      const suffix = Attribution.toDataSuffix(original)
      const fullData = `0xabcdef${suffix.slice(2)}` as const // Add some transaction data

      const parsed = Attribution.fromData(fullData)

      expect(parsed).toEqual({
        codes: original.codes,
        id: 0,
      })
    })
  })

  describe('schema 1 (custom registry)', () => {
    test('example from eip', () => {
      const encoded =
        '0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021' as const

      const expected = {
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xcccccccccccccccccccccccccccccccccccccccc',
          chainId: 8453,
        },
        id: 1,
      } as Attribution.AttributionSchemaId1

      const decoded = Attribution.fromData(encoded)
      expect(decoded).toEqual(expected)
    })

    test('multiple entities', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xcccccccccccccccccccccccccccccccccccccccc',
          chainId: 1,
        },
        id: 1,
      })
      const result = Attribution.fromData(
        `0xdddddddd${suffix.slice(2)}` as const,
      )
      expect(result).toEqual({
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xcccccccccccccccccccccccccccccccccccccccc',
          chainId: 1,
        },
        id: 1,
      })
    })

    test('single code', () => {
      const suffix = Attribution.toDataSuffix({
        codes: ['x'],
        codeRegistry: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: 10,
        },
        id: 1,
      })
      const result = Attribution.fromData(
        `0xdddddddd${suffix.slice(2)}` as const,
      )

      expect(result).toEqual({
        codes: ['x'],
        codeRegistry: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: 10,
        },
        id: 1,
      })
    })

    test.each([
      1, // 1 byte
      8453, // 2 byte
      84532, // 3 byte
    ])('roundtrip with different chain ids{chainId=%i}', (chainId) => {
      const original = {
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const,
          chainId,
        },
        id: 1 as const,
      }

      const suffix = Attribution.toDataSuffix(original)
      const fullData = `0xabcdef${suffix.slice(2)}` as const // Add some transaction data

      const parsed = Attribution.fromData(fullData)

      expect(parsed).toEqual(original)
    })
  })

  describe('error cases', () => {
    test('invalid schemaId', () => {
      // Input: transaction data + length (0xff) + unknown schema ID (0xff) + ERC suffix
      const input = '0xddddddddff80218021802180218021802180218021'

      const result = Attribution.fromData(input)

      // Parsing stops, unknown schemaId returns undefined
      expect(result).toBeUndefined()
    })

    test('missing ERC suffix', () => {
      // Input without valid ERC suffix
      const input =
        '0xdddddddd62617365617070070000000000000000000000000000000000000000'

      const result = Attribution.fromData(input)

      expect(result).toBeUndefined()
    })

    test('data too short', () => {
      const input = '0xdddddddd'

      const result = Attribution.fromData(input)

      expect(result).toBeUndefined()
    })
  })
})
