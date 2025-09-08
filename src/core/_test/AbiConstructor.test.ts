import { AbiConstructor } from 'ox'
import { describe, expect, test } from 'vitest'
import { Constructor } from '../../../contracts/generated.js'
import { anvilMainnet } from '../../../test/anvil.js'
import { seaportContractConfig } from '../../../test/constants/abis.js'
import { address } from '../../../test/constants/addresses.js'

describe('decode', () => {
  test('default', () => {
    {
      const abiConstructor = AbiConstructor.from('constructor()')
      const encoded = AbiConstructor.encode(abiConstructor, {
        bytecode: Constructor.bytecode.object,
      })

      expect(
        AbiConstructor.decode(abiConstructor, {
          bytecode: Constructor.bytecode.object,
          data: encoded,
        }),
      ).toBe(undefined)
    }

    {
      const encoded = AbiConstructor.encode(
        [AbiConstructor.from('constructor()')],
        {
          bytecode: Constructor.bytecode.object,
        },
      )

      expect(
        AbiConstructor.decode([AbiConstructor.from('constructor()')], {
          bytecode: Constructor.bytecode.object,
          data: encoded,
        }),
      ).toBe(undefined)
    }
  })

  test('behavior: args', () => {
    {
      const abiConstructor = AbiConstructor.from(
        'constructor(address, uint256)',
      )
      const encoded = AbiConstructor.encode(abiConstructor, {
        bytecode: Constructor.bytecode.object,
        args: [address.vitalik, 123n],
      })

      expect(
        AbiConstructor.decode(abiConstructor, {
          bytecode: Constructor.bytecode.object,
          data: encoded,
        }),
      ).toMatchInlineSnapshot(`
      [
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        123n,
      ]
    `)
    }

    {
      const encoded = AbiConstructor.encode(Constructor.abi, {
        bytecode: Constructor.bytecode.object,
        args: [address.vitalik, 123n],
      })

      expect(
        AbiConstructor.decode(Constructor.abi, {
          bytecode: Constructor.bytecode.object,
          data: encoded,
        }),
      ).toMatchInlineSnapshot(`
      [
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        123n,
      ]
    `)
    }
  })

  test('behavior: network', async () => {
    const abiConstructor = AbiConstructor.fromAbi(Constructor.abi)

    const data = AbiConstructor.encode(abiConstructor, {
      bytecode: Constructor.bytecode.object,
      args: [address.vitalik, 123n],
    })

    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [
        {
          data,
        },
      ],
    })

    await anvilMainnet.request({
      method: 'evm_mine',
      params: { blocks: '0x1' },
    })

    const { input } = (await anvilMainnet.request({
      method: 'eth_getTransactionByHash',
      params: [hash],
    }))!

    expect(
      AbiConstructor.decode(abiConstructor, {
        bytecode: Constructor.bytecode.object,
        data: input,
      }),
    ).toMatchInlineSnapshot(`
      [
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        123n,
      ]
    `)
  })
})

describe('encode', () => {
  test('default', () => {
    {
      const abiConstructor = AbiConstructor.from('constructor()')

      expect(
        AbiConstructor.encode(abiConstructor, {
          bytecode: '0xdeadbeef',
        }),
      ).toBe('0xdeadbeef')
    }

    expect(
      AbiConstructor.encode([AbiConstructor.from('constructor()')], {
        bytecode: '0xdeadbeef',
      }),
    ).toBe('0xdeadbeef')
  })

  test('behavior: args', () => {
    {
      const abiConstructor = AbiConstructor.from(
        'constructor(address, uint256)',
      )

      expect(
        AbiConstructor.encode(abiConstructor, {
          bytecode: '0xdeadbeef',
          args: [address.vitalik, 123n],
        }),
      ).toBe(
        '0xdeadbeef000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000007b',
      )
    }

    expect(
      AbiConstructor.encode(Constructor.abi, {
        bytecode: '0xdeadbeef',
        args: [address.vitalik, 123n],
      }),
    ).toBe(
      '0xdeadbeef000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000007b',
    )
  })

  test('behavior: network', async () => {
    const abiConstructor = AbiConstructor.fromAbi(Constructor.abi)

    const data = AbiConstructor.encode(abiConstructor, {
      bytecode: Constructor.bytecode.object,
      args: [address.vitalik, 123n],
    })

    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [
        {
          data,
        },
      ],
    })

    await anvilMainnet.request({
      method: 'evm_mine',
      params: { blocks: '0x1' },
    })

    const { contractAddress } = (await anvilMainnet.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    }))!

    expect(contractAddress).toBeDefined()
  })
})

describe('format', () => {
  test('default', () => {
    const approve = AbiConstructor.from({
      inputs: [{ name: 'owner', type: 'address' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'constructor',
    })
    const formatted = AbiConstructor.format(approve)
    expect(formatted).toMatchInlineSnapshot(`"constructor(address owner)"`)
  })
})

describe('from', () => {
  test('default', () => {
    const abiConstructor = AbiConstructor.from({
      inputs: [{ name: 'owner', type: 'address' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'constructor',
    })

    expect(abiConstructor).toMatchInlineSnapshot(`
    {
      "hash": "0xf8a6c595894ab588edd59e406425331fe9ad3266445da35ab4aa27007b7a602a",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
        },
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
  })

  test('behavior: human readable', () => {
    const abiConstructor = AbiConstructor.from('constructor(address owner)')

    expect(abiConstructor).toMatchInlineSnapshot(`
    {
      "hash": "0xf8a6c595894ab588edd59e406425331fe9ad3266445da35ab4aa27007b7a602a",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
  })

  test('behavior: human readable (struct)', () => {
    const abiConstructor = AbiConstructor.from([
      'struct Foo { address owner }',
      'constructor(Foo foo)',
    ])

    expect(abiConstructor).toMatchInlineSnapshot(`
    {
      "hash": "0x046f6226ce02998a10b2101bbeb1a3bd095efb55989b57f3781e659a4a2a8011",
      "inputs": [
        {
          "components": [
            {
              "name": "owner",
              "type": "address",
            },
          ],
          "name": "foo",
          "type": "tuple",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
  })
})

describe('fromAbi', () => {
  test('default', () => {
    const abiConstructor = AbiConstructor.fromAbi(seaportContractConfig.abi)
    expect(abiConstructor).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "name": "conduitController",
          "type": "address",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "constructor",
    }
  `)
  })

  test('error: no constructor', () => {
    expect(() => AbiConstructor.fromAbi([])).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "constructor" not found.]`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(AbiConstructor)).toMatchInlineSnapshot(`
    [
      "decode",
      "encode",
      "format",
      "from",
      "fromAbi",
    ]
  `)
})
