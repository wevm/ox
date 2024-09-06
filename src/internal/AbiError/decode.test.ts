import { Abi, AbiError, AbiFunction } from 'ox'
import { describe, expect, test } from 'vitest'
import { Errors } from '../../../contracts/generated.js'
import { anvilMainnet } from '../../../test/anvil.js'

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

describe('behavior: network', async () => {
  const hash = await anvilMainnet.request({
    method: 'eth_sendTransaction',
    params: [
      {
        data: Errors.bytecode.object,
      },
    ],
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
            data: AbiFunction.encodeInput(
              AbiFunction.fromAbi(abi, { name: 'revertRead' }),
            ),
            to: contractAddress,
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
            data: AbiFunction.encodeInput(
              AbiFunction.fromAbi(abi, { name: 'assertRead' }),
            ),
            to: contractAddress,
          },
        ],
      })
      .catch((error) => {
        const errorItem = AbiError.fromAbi(abi, { name: error.data })
        const value = AbiError.decode(errorItem, error.data)
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
            data: AbiFunction.encodeInput(
              AbiFunction.fromAbi(abi, { name: 'overflowRead' }),
            ),
            to: contractAddress,
          },
        ],
      })
      .catch((error) => {
        const errorItem = AbiError.fromAbi(abi, { name: error.data })
        const value = AbiError.decode(errorItem, error.data)
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
            data: AbiFunction.encodeInput(
              AbiFunction.fromAbi(abi, { name: 'complexCustomWrite' }),
            ),
            to: contractAddress,
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
