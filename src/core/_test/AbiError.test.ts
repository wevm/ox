import { Abi, AbiError, AbiFunction, AbiItem } from 'ox'
import { describe, expect, test } from 'vitest'
import { Errors } from '../../../contracts/generated.js'
import { anvilMainnet } from '../../../test/anvil.js'
import { seaportContractConfig } from '../../../test/constants/abis.js'

describe('decode', () => {
  test('behavior: no args', () => {
    const error = AbiError.from('error InvalidSignature()')
    const data = AbiError.encode(error)
    expect(data).toMatchInlineSnapshot(`"0x8baa579f"`)
    expect(AbiError.decode(error, data)).toEqual(undefined)
  })

  test('behavior: single arg', () => {
    const error = AbiError.from('error InvalidSignature(uint8 yParity)')

    const data = AbiError.encode(error, [1])
    expect(data).toMatchInlineSnapshot(
      `"0x480770df0000000000000000000000000000000000000000000000000000000000000001"`,
    )

    const decoded = AbiError.decode(error, data)
    expect(decoded).toEqual(1)
  })

  test('behavior: multiple args', () => {
    const error = AbiError.from('error Example(uint r, uint s, uint8 yParity)')

    const data = AbiError.encode(error, [420n, 69n, 1])
    expect(data).toMatchInlineSnapshot(
      `"0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001"`,
    )

    const decoded = AbiError.decode(error, data)
    expect(decoded).toEqual([420n, 69n, 1])
  })

  test('behavior: as = Object', () => {
    const error = AbiError.from('error Example(uint r, uint s, uint8 yParity)')

    const data = AbiError.encode(error, [420n, 69n, 1])
    expect(data).toMatchInlineSnapshot(
      `"0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001"`,
    )

    const decoded = AbiError.decode(error, data, { as: 'Object' })
    expect(decoded).toEqual({
      r: 420n,
      s: 69n,
      yParity: 1,
    })
  })

  test('behavior: as = Object, single arg', () => {
    const error = AbiError.from('error Example(uint8 yParity)')

    const data = AbiError.encode(error, [1])
    expect(data).toMatchInlineSnapshot(
      `"0x1e9dde100000000000000000000000000000000000000000000000000000000000000001"`,
    )

    const decoded = AbiError.decode(error, data, { as: 'Object' })
    expect(decoded).toEqual(1)
  })

  test('error: invalid data', () => {
    const error = AbiError.from('error Example(uint256 a)')
    expect(() =>
      AbiError.decode(error, '0xaaa'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.InvalidSelectorSizeError: Selector size is invalid. Expected 4 bytes. Received 2 bytes ("0xaaa").]`,
    )
  })

  describe('behavior: network', async () => {
    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [
        {
          data: Errors.bytecode.object,
        },
      ],
    })
    await anvilMainnet.request({
      method: 'anvil_mine',
      params: ['0x1', '0x0'],
    })
    const { contractAddress } = (await anvilMainnet.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    }))!

    const abi = Abi.from(Errors.abi)

    test('solidity `Error`', async () => {
      const result = await anvilMainnet
        .request({
          method: 'eth_call',
          params: [
            {
              data: AbiFunction.encodeData(
                AbiFunction.fromAbi(abi, 'revertRead'),
              ),
              to: contractAddress,
            },
          ],
        })
        .catch((error) => {
          const errorItem = AbiError.fromAbi(abi, error.data.data)
          const value = AbiError.decode(errorItem, error.data.data)
          return [errorItem, value]
        })

      expect(result).toMatchInlineSnapshot(`
      [
        {
          "hash": "0x08c379a0afcc32b1a39302f7cb8073359698411ab5fd6e3edb2c02c0b5fba8aa",
          "inputs": [
            {
              "name": "message",
              "type": "string",
            },
          ],
          "name": "Error",
          "type": "error",
        },
        "This is a revert message",
      ]
    `)
    })

    test('solidity `Panic` (assert)', async () => {
      const result = await anvilMainnet
        .request({
          method: 'eth_call',
          params: [
            {
              data: AbiFunction.encodeData(
                AbiFunction.fromAbi(abi, 'assertRead'),
              ),
              to: contractAddress,
            },
          ],
        })
        .catch((error) => {
          const errorItem = AbiError.fromAbi(abi, error.data.data)
          const value = AbiError.decode(errorItem, error.data.data)
          if (typeof value !== 'number') return
          return [errorItem, value, AbiError.panicReasons[value]]
        })

      expect(result).toMatchInlineSnapshot(`
      [
        {
          "hash": "0x25fba4f52ccf6f699393995e0f649c9072d088cffa43609495ffad9216c5b1dc",
          "inputs": [
            {
              "name": "reason",
              "type": "uint8",
            },
          ],
          "name": "Panic",
          "type": "error",
        },
        1,
        "An \`assert\` condition failed.",
      ]
    `)
    })

    test('solidity `Panic` (overflow)', async () => {
      const result = await anvilMainnet
        .request({
          method: 'eth_call',
          params: [
            {
              data: AbiFunction.encodeData(
                AbiFunction.fromAbi(abi, 'overflowRead'),
              ),
              to: contractAddress,
            },
          ],
        })
        .catch((error) => {
          const errorItem = AbiError.fromAbi(abi, error.data.data)
          const value = AbiError.decode(errorItem, error.data.data)
          if (typeof value !== 'number') return
          return [errorItem, value, AbiError.panicReasons[value]]
        })

      expect(result).toMatchInlineSnapshot(`
      [
        {
          "hash": "0x25fba4f52ccf6f699393995e0f649c9072d088cffa43609495ffad9216c5b1dc",
          "inputs": [
            {
              "name": "reason",
              "type": "uint8",
            },
          ],
          "name": "Panic",
          "type": "error",
        },
        17,
        "Arithmetic operation resulted in underflow or overflow.",
      ]
    `)
    })

    test('custom error', async () => {
      const result = await anvilMainnet
        .request({
          method: 'eth_call',
          params: [
            {
              data: AbiFunction.encodeData(
                AbiFunction.fromAbi(abi, 'complexCustomWrite'),
              ),
              to: contractAddress,
            },
          ],
        })
        .catch((error) => {
          const errorItem = AbiError.fromAbi(abi, error.data.data)
          const value = AbiError.decode(errorItem, error.data.data)
          return [errorItem, value]
        })

      expect(result).toMatchInlineSnapshot(`
      [
        {
          "hash": "0xdb731cf434b2ed4535c45e759ac81849e63af37b1fec522c9145652b5caee860",
          "inputs": [
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "sender",
                  "type": "address",
                },
                {
                  "internalType": "uint256",
                  "name": "bar",
                  "type": "uint256",
                },
              ],
              "internalType": "struct Errors.Foo",
              "name": "foo",
              "type": "tuple",
            },
            {
              "internalType": "string",
              "name": "message",
              "type": "string",
            },
            {
              "internalType": "uint256",
              "name": "number",
              "type": "uint256",
            },
          ],
          "name": "ComplexError",
          "type": "error",
        },
        [
          {
            "bar": 69n,
            "sender": "0x0000000000000000000000000000000000000000",
          },
          "bugger",
          69n,
        ],
      ]
    `)
    })
  })

  test('behavior: overload with abi', () => {
    const abi = Abi.from([
      'error InvalidSignature(uint r, uint s, uint8 yParity)',
    ])
    const data =
      '0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001'

    // Test both overload patterns
    const abiError = AbiError.fromAbi(abi, 'InvalidSignature')
    const decoded1 = AbiError.decode(abiError, data)
    const decoded2 = AbiError.decode(abi, 'InvalidSignature', data)

    expect(decoded1).toEqual(decoded2)
    expect(decoded2).toEqual([420n, 69n, 1])
  })

  test('behavior: overload with options', () => {
    const abi = Abi.from([
      'error InvalidSignature(uint r, uint s, uint8 yParity)',
    ])
    const data =
      '0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001'

    // Test both overload patterns with options
    const abiError = AbiError.fromAbi(abi, 'InvalidSignature')
    const decoded1 = AbiError.decode(abiError, data, { as: 'Object' })
    const decoded2 = AbiError.decode(abi, 'InvalidSignature', data, {
      as: 'Object',
    })

    expect(decoded1).toEqual(decoded2)
    expect(decoded2).toEqual({ r: 420n, s: 69n, yParity: 1 })
  })
})

describe('encode', () => {
  test('default', () => {
    const error = AbiError.from('error Example()')
    expect(AbiError.encode(error)).toMatchInlineSnapshot(`"0xb085b9a5"`)
  })

  test('behavior: with args', () => {
    const error = AbiError.from('error Example(uint256)')
    expect(AbiError.encode(error, [69420n])).toMatchInlineSnapshot(
      `"0xdbecc3720000000000000000000000000000000000000000000000000000000000010f2c"`,
    )
  })

  test('behavior: no hash', () => {
    const error = AbiError.from('error Example()')
    expect(
      AbiError.encode({ ...error, hash: undefined }),
    ).toMatchInlineSnapshot(`"0xb085b9a5"`)
  })

  test('behavior: overload with abi', () => {
    const abi = Abi.from([
      'error InvalidSignature(uint r, uint s, uint8 yParity)',
    ])

    // Test both overload patterns
    const abiError = AbiError.fromAbi(abi, 'InvalidSignature')
    const encoded1 = AbiError.encode(abiError, [420n, 69n, 1])
    const encoded2 = AbiError.encode(abi, 'InvalidSignature', [420n, 69n, 1])

    expect(encoded1).toEqual(encoded2)
    expect(encoded2).toMatchInlineSnapshot(
      `"0xe466f0a500000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001"`,
    )
  })

  test('behavior: overload with abi - no args', () => {
    const abi = Abi.from(['error Example()'])

    // Test both overload patterns
    const abiError = AbiError.fromAbi(abi, 'Example')
    const encoded1 = AbiError.encode(abiError)
    const encoded2 = AbiError.encode(abi, 'Example')

    expect(encoded1).toEqual(encoded2)
    expect(encoded2).toMatchInlineSnapshot(`"0xb085b9a5"`)
  })
})

describe('format', () => {
  test('default', () => {
    const exampleError = AbiError.from({
      type: 'error',
      name: 'Example',
      inputs: [
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'amount',
          type: 'uint256',
        },
      ],
    })
    const formatted = AbiError.format(exampleError)
    expect(formatted).toMatchInlineSnapshot(
      `"error Example(address spender, uint256 amount)"`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    {
      const abiItem = AbiError.from({
        inputs: [{ name: 'v', type: 'uint8' }],
        name: 'BadSignatureV',
        type: 'error',
      })
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0x1f003d0ab3c21a082e88d5c936eb366321476aa1508b9238066e9f135aa38772",
        "inputs": [
          {
            "name": "v",
            "type": "uint8",
          },
        ],
        "name": "BadSignatureV",
        "type": "error",
      }
    `)
    }

    {
      const abiItem = AbiError.from('error BadSignatureV(uint8 v)')
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0x1f003d0ab3c21a082e88d5c936eb366321476aa1508b9238066e9f135aa38772",
        "inputs": [
          {
            "name": "v",
            "type": "uint8",
          },
        ],
        "name": "BadSignatureV",
        "type": "error",
      }
    `)
    }

    {
      const abiItem = AbiError.from([
        'struct Signature { uint8 v; }',
        'error BadSignatureV(Signature signature)',
      ])
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xfced1c858d7f2bfb0878dcc1cb75305474698643ad13e7d8e5e1b96283a8c7c2",
        "inputs": [
          {
            "components": [
              {
                "name": "v",
                "type": "uint8",
              },
            ],
            "name": "signature",
            "type": "tuple",
          },
        ],
        "name": "BadSignatureV",
        "type": "error",
      }
    `)
    }
  })

  test('options: prepare', () => {
    const abiItem = AbiError.from(
      {
        inputs: [{ name: 'v', type: 'uint8' }],
        name: 'BadSignatureV',
        type: 'error',
      },
      { prepare: false },
    )
    expect(abiItem).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "name": "v",
          "type": "uint8",
        },
      ],
      "name": "BadSignatureV",
      "type": "error",
    }
  `)
  })
})

describe('fromAbi', () => {
  test('default', () => {
    expect(
      AbiError.fromAbi(seaportContractConfig.abi, 'BadSignatureV'),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0x1f003d0ab3c21a082e88d5c936eb366321476aa1508b9238066e9f135aa38772",
      "inputs": [
        {
          "name": "v",
          "type": "uint8",
        },
      ],
      "name": "BadSignatureV",
      "type": "error",
    }
  `)
  })

  test('behavior: prepare = false', () => {
    expect(
      AbiError.fromAbi(seaportContractConfig.abi, 'BadSignatureV', {
        prepare: false,
      }),
    ).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "name": "v",
          "type": "uint8",
        },
      ],
      "name": "BadSignatureV",
      "type": "error",
    }
  `)
  })

  test('behavior: selector as name', () => {
    const item = AbiError.fromAbi(seaportContractConfig.abi, 'BadSignatureV')
    const selector = AbiItem.getSelector(item)
    expect(
      AbiError.fromAbi(seaportContractConfig.abi, selector),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0x1f003d0ab3c21a082e88d5c936eb366321476aa1508b9238066e9f135aa38772",
      "inputs": [
        {
          "name": "v",
          "type": "uint8",
        },
      ],
      "name": "BadSignatureV",
      "type": "error",
    }
  `)
  })

  test('behavior: able to extract solidity Error', () => {
    const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
    const item = AbiError.fromAbi(abi, 'Error')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x08c379a0afcc32b1a39302f7cb8073359698411ab5fd6e3edb2c02c0b5fba8aa",
      "inputs": [
        {
          "name": "message",
          "type": "string",
        },
      ],
      "name": "Error",
      "type": "error",
    }
  `)
  })

  test('behavior: able to extract solidity Error (selector)', () => {
    const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
    const item = AbiError.fromAbi(abi, AbiError.solidityErrorSelector)
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x08c379a0afcc32b1a39302f7cb8073359698411ab5fd6e3edb2c02c0b5fba8aa",
      "inputs": [
        {
          "name": "message",
          "type": "string",
        },
      ],
      "name": "Error",
      "type": "error",
    }
  `)
  })

  test('behavior: able to extract solidity Panic', () => {
    const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
    const item = AbiError.fromAbi(abi, 'Panic')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x25fba4f52ccf6f699393995e0f649c9072d088cffa43609495ffad9216c5b1dc",
      "inputs": [
        {
          "name": "reason",
          "type": "uint8",
        },
      ],
      "name": "Panic",
      "type": "error",
    }
  `)
  })

  test('behavior: able to extract solidity Panic (selector)', () => {
    const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
    const item = AbiError.fromAbi(abi, AbiError.solidityPanicSelector)
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x25fba4f52ccf6f699393995e0f649c9072d088cffa43609495ffad9216c5b1dc",
      "inputs": [
        {
          "name": "reason",
          "type": "uint8",
        },
      ],
      "name": "Panic",
      "type": "error",
    }
  `)
  })

  test('error: no matching name', () => {
    expect(() =>
      // @ts-expect-error
      AbiError.fromAbi(seaportContractConfig.abi, 'cancel'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI error with name "cancel" not found.]`,
    )
  })

  test('error: no matching name', () => {
    expect(() =>
      AbiError.fromAbi([] as readonly unknown[], 'balanceOf', {
        args: ['0x0000000000000000000000000000000000000000'],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "balanceOf" not found.]`,
    )
  })

  test('error: no matching data', () => {
    expect(() =>
      AbiError.fromAbi([], '0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "0xdeadbeef" not found.]`,
    )
  })

  test('behavior: overloads', () => {
    const abi = Abi.from([
      'error Bar()',
      'error Foo(bytes)',
      'error Foo(uint256)',
    ])
    const item = AbiError.fromAbi(abi, 'Foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xefc9afd358f1472682cf8cc82e1d3ae36be2538ed858a4a604119399d6f22b48",
      "inputs": [
        {
          "type": "bytes",
        },
      ],
      "name": "Foo",
      "overloads": [
        {
          "inputs": [
            {
              "type": "uint256",
            },
          ],
          "name": "Foo",
          "type": "error",
        },
      ],
      "type": "error",
    }
  `)
  })

  test('behavior: overloads: no inputs', () => {
    const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
    const item = AbiError.fromAbi(abi, 'Foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
      "inputs": [],
      "name": "Foo",
      "type": "error",
    }
  `)
  })

  test('overloads: no args', () => {
    const abi = Abi.from(['error Bar()', 'error Foo(uint256)', 'error Foo()'])
    const item = AbiError.fromAbi(abi, 'Foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
      "inputs": [],
      "name": "Foo",
      "type": "error",
    }
  `)
  })

  test('behavior: overloads: different types', () => {
    const abi = Abi.from([
      'error Mint()',
      'error Mint(uint256)',
      'error Mint(string)',
    ])
    const item = AbiError.fromAbi(abi, 'Mint')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x34c73884fbbb790762253ae313e57da96c00670344647f0cb8d41ee92b9f1971",
      "inputs": [],
      "name": "Mint",
      "type": "error",
    }
  `)

    const item_2 = AbiError.fromAbi(abi, 'Mint', {
      args: [420n],
    })
    expect(item_2).toMatchInlineSnapshot(`
    {
      "hash": "0x07883703ed0e86588a40d76551c92f8a4b329e3bf19765e0e6749473c1a84665",
      "inputs": [
        {
          "type": "uint256",
        },
      ],
      "name": "Mint",
      "type": "error",
    }
  `)

    const item_3 = AbiError.fromAbi(abi, 'Mint', {
      args: ['foo'],
    })
    expect(item_3).toMatchInlineSnapshot(`
    {
      "hash": "0xc5e1d731c47dbd6a8c38e6ee9137792904eae9d20174034d1dc9a5781a0f855b",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Mint",
      "type": "error",
    }
  `)
  })

  test('behavior: overloads: tuple', () => {
    const abi = Abi.from([
      'error Example(uint256 foo, (string a, string b, uint256 c) bar)',
      'error Example(uint256 foo, (string a, (string merp, string meep) b, address c) bar)',
    ])
    const item = AbiError.fromAbi(abi, 'Example', {
      args: [
        420n,
        {
          a: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
          b: { merp: 'test', meep: 'test' },
          c: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
        },
      ],
    })
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x3cfe2f5f5794a704453504eac86b65a35f5912de763230232d0d593c5127e517",
      "inputs": [
        {
          "name": "foo",
          "type": "uint256",
        },
        {
          "components": [
            {
              "name": "a",
              "type": "string",
            },
            {
              "components": [
                {
                  "name": "merp",
                  "type": "string",
                },
                {
                  "name": "meep",
                  "type": "string",
                },
              ],
              "name": "b",
              "type": "tuple",
            },
            {
              "name": "c",
              "type": "address",
            },
          ],
          "name": "bar",
          "type": "tuple",
        },
      ],
      "name": "Example",
      "type": "error",
    }
  `)
  })

  test('behavior: overloads: ambiguious types', () => {
    expect(() =>
      AbiError.fromAbi(
        Abi.from(['error Foo(address)', 'error Foo(bytes20)']),
        'Foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`Foo(bytes20)\`, and
    \`address\` in \`Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(() =>
      AbiError.fromAbi(
        Abi.from([
          'error Foo(string)',
          'error Foo(uint)',
          'error Foo(address)',
        ]),
        'Foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`address\` in \`Foo(address)\`, and
    \`string\` in \`Foo(string)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(
      AbiError.fromAbi(
        Abi.from([
          'error Foo(string)',
          'error Foo(uint)',
          'error Foo(address)',
        ]),
        'Foo',
        {
          // 21 bytes (invalid address)
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251eee'],
        },
      ),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0x9f0b7f1630bdb7d474466e2dfef0fb9dff65f7a50eec83935b68f77d0808f08a",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Foo",
      "type": "error",
    }
  `)

    expect(
      AbiError.fromAbi(
        Abi.from([
          'error Foo(string)',
          'error Foo(uint)',
          'error Foo(address)',
        ]),
        'Foo',
        {
          // non-hex (invalid address)
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251z'],
        },
      ),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0x9f0b7f1630bdb7d474466e2dfef0fb9dff65f7a50eec83935b68f77d0808f08a",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Foo",
      "type": "error",
    }
  `)

    expect(() =>
      AbiError.fromAbi(
        Abi.from([
          'error Foo(address)',
          'error Foo(uint)',
          'error Foo(string)',
        ]),
        'Foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`string\` in \`Foo(string)\`, and
    \`address\` in \`Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(() =>
      AbiError.fromAbi(
        Abi.from(['error Foo((address))', 'error Foo((bytes20))']),
        'Foo',
        {
          args: [['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`Foo((bytes20))\`, and
    \`address\` in \`Foo((address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(() =>
      AbiError.fromAbi(
        Abi.from([
          'error Foo(string, (address))',
          'error Foo(string, (bytes))',
        ]),
        'Foo',
        {
          args: ['foo', ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes\` in \`Foo(string,(bytes))\`, and
    \`address\` in \`Foo(string,(address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)
  })
})

describe('getSelector', () => {
  test('default', () => {
    expect(AbiError.getSelector('error BadSignatureV(uint8 v)')).toEqual(
      '0x1f003d0a',
    )
    expect(AbiError.getSelector('BadSignatureV(uint8 v)')).toEqual('0x1f003d0a')
  })

  test('behavior: from `AbiError`', () => {
    expect(
      AbiError.getSelector(AbiError.from('error BadSignatureV(uint8 v)')),
    ).toEqual('0x1f003d0a')
  })
})

test('exports', () => {
  expect(Object.keys(AbiError)).toMatchInlineSnapshot(`
    [
      "decode",
      "encode",
      "format",
      "from",
      "fromAbi",
      "getSelector",
      "panicReasons",
      "solidityError",
      "solidityErrorSelector",
      "solidityPanic",
      "solidityPanicSelector",
    ]
  `)
})
