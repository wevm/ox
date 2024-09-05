import { Abi, AbiError, AbiFunction } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'
import { wagmiContractConfig } from '../../../test/constants/abis.js'

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
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidSelectorSizeError: Selector size is invalid. Expected 4 bytes. Received 2 bytes ("0xaaa").

    See: https://oxlib.sh/errors#invalidselectorsizeerror]
  `)
})

test('behavior: network', async () => {
  const abi = Abi.from(wagmiContractConfig.abi)

  const approve = AbiFunction.fromAbi(abi, {
    name: 'approve',
  })

  const result = await anvilMainnet
    .request({
      method: 'eth_call',
      params: [
        {
          data: AbiFunction.encodeInput(approve, [
            '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
            69420n,
          ]),
          to: wagmiContractConfig.address,
        },
      ],
    })
    .catch((error) => {
      const errorItem = AbiError.fromAbi(abi, { name: error.data })
      const value = AbiError.decode(errorItem, error.data)
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
      "ERC721: approve caller is not owner nor approved for all",
    ]
  `)
})
