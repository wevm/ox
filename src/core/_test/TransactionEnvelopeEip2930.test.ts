import { Rlp, Secp256k1, TxEnvelopeEip2930, Value } from 'ox'
import { assertType, describe, expect, expectTypeOf, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'
import { anvilMainnet } from '../../../test/prool.js'

describe('assert', () => {
  test('fee cap too high', () => {
    expect(() =>
      TxEnvelopeEip2930.assert({
        gasPrice: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TransactionEnvelope.GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })

  test('invalid chainId', () => {
    expect(() =>
      TxEnvelopeEip2930.assert({ chainId: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TxEnvelopeEip2930.assert({ to: '0x123', chainId: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0x123" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })
})

describe('deserialize', () => {
  const transaction = TxEnvelopeEip2930.from({
    chainId: 1,
    accessList: [
      {
        address: '0x1234512345123451234512345123451234512345',
        storageKeys: [
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      },
    ],
    gasPrice: Value.fromGwei('2'),
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
  })

  test('default', () => {
    const serialized = TxEnvelopeEip2930.serialize(transaction)
    const deserialized = TxEnvelopeEip2930.deserialize(serialized)
    assertType<TxEnvelopeEip2930.TxEnvelopeEip2930>(deserialized)
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TxEnvelopeEip2930.from({
      chainId: 1,
      gasPrice: 1n,
      nonce: 0n,
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          ],
        },
      ],
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction)
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TxEnvelopeEip2930.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction_gas)
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('data', () => {
    const transaction_data = TxEnvelopeEip2930.from({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction_data)
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction_data)
  })

  test('data', () => {
    const transaction_data = TxEnvelopeEip2930.from({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction_data)
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction_data)
  })

  test('signature', async () => {
    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip2930.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction, {
      signature,
    })
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  describe('errors', () => {
    test('invalid transaction (all missing)', () => {
      expect(() =>
        TxEnvelopeEip2930.deserialize(`0x01${Rlp.fromHex([]).slice(2)}`),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip2930" was provided.

      Serialized Transaction: "0x01c0"
      Missing Attributes: chainId, nonce, gasPrice, gas, to, value, data, accessList]
    `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TxEnvelopeEip2930.deserialize(
          `0x01${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip2930" was provided.

      Serialized Transaction: "0x01c20001"
      Missing Attributes: gasPrice, gas, to, value, data, accessList]
    `)
    })

    test('invalid transaction (missing signature)', () => {
      expect(() =>
        TxEnvelopeEip2930.deserialize(
          `0x01${Rlp.fromHex([
            '0x',
            '0x',
            '0x',
            '0x',
            '0x',
            '0x',
            '0x',
            '0x',
            '0x',
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip2930" was provided.

      Serialized Transaction: "0x01c9808080808080808080"
      Missing Attributes: r, s]
    `)
    })
  })
})

describe('from', () => {
  test('default', () => {
    {
      const envelope = TxEnvelopeEip2930.from({
        accessList: [],
        chainId: 1,
        gasPrice: 69420n,
        nonce: 0n,
      })
      expectTypeOf(
        envelope,
      ).toMatchTypeOf<TxEnvelopeEip2930.TxEnvelopeEip2930>()
      expect(envelope).toMatchInlineSnapshot(`
        {
          "accessList": [],
          "chainId": 1,
          "gasPrice": 69420n,
          "nonce": 0n,
          "type": "eip2930",
        }
      `)
    }

    {
      const envelope = TxEnvelopeEip2930.from({
        chainId: 1,
        gasPrice: 69420n,
        nonce: 0n,
      })
      const serialized = TxEnvelopeEip2930.serialize(envelope)
      expect(TxEnvelopeEip2930.from(serialized)).toEqual(envelope)
    }

    {
      const envelope = TxEnvelopeEip2930.from({
        chainId: 1,
        gasPrice: 69420n,
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: 0,
        nonce: 0n,
      })
      const serialized = TxEnvelopeEip2930.serialize(envelope)
      const envelope2 = TxEnvelopeEip2930.from(serialized)
      expect(envelope2).toEqual(envelope)
    }
  })

  test('options: signature', () => {
    const envelope = TxEnvelopeEip2930.from(
      {
        chainId: 1,
        to: '0x0000000000000000000000000000000000000000',
        nonce: 0n,
        value: 69n,
      },
      {
        signature: {
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
          yParity: 0,
        },
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "nonce": 0n,
        "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
        "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
        "to": "0x0000000000000000000000000000000000000000",
        "type": "eip2930",
        "value": 69n,
        "yParity": 0,
      }
    `)
    const serialized = TxEnvelopeEip2930.serialize(envelope)
    const envelope2 = TxEnvelopeEip2930.from(serialized)
    expect(envelope2).toEqual(envelope)
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const envelope = TxEnvelopeEip2930.from({
      chainId: 1,
      gas: 21000n,
      maxFeePerGas: 13000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      type: 'eip2930',
    })

    const hash = TxEnvelopeEip2930.hash(envelope, { presign: true })
    expect(hash).toMatchInlineSnapshot(
      `"0x0ec6ac926e256ac597c5e6a2e635019ccd07974365f970f479589ace534db44a"`,
    )

    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip2930.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })

    const envelope_signed = TxEnvelopeEip2930.from(envelope, {
      signature,
    })

    {
      const hash = TxEnvelopeEip2930.hash(envelope_signed)
      expect(hash).toMatchInlineSnapshot(
        `"0x70bbd82fb81c02a945125319cb58a42a69f38426d0870f9be2b196437b3dd177"`,
      )
    }
    {
      const hash_presign = TxEnvelopeEip2930.getSignPayload(envelope_signed)
      expect(hash_presign).toEqual(hash)
    }
  })
})

describe('hash', () => {
  test('default', () => {
    const envelope = TxEnvelopeEip2930.from({
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          ],
        },
      ],
      chainId: 1,
      gas: 21000n,
      gasPrice: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      type: 'eip2930',
      r: '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
      s: '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
      v: 27,
    })

    const hash = TxEnvelopeEip2930.hash(envelope)
    expect(hash).toMatchInlineSnapshot(
      `"0xfcf39cca082499fb8b96317cc525a6697d65cf7bc8d7fc30d9e8d9b4c45d9a51"`,
    )
  })
})

describe('serialize', () => {
  const transaction = TxEnvelopeEip2930.from({
    gasPrice: Value.fromGwei('2'),
    nonce: 785n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
    chainId: 1,
    accessList: [
      {
        address: '0x1234512345123451234512345123451234512345',
        storageKeys: [
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      },
    ],
  })

  test('default', () => {
    const serialized = TxEnvelopeEip2930.serialize(transaction)
    assertType<TxEnvelopeEip2930.Serialized>(serialized)
    expect(serialized).toEqual(
      '0x01f863018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction)
  })

  test('default (all zeros)', () => {
    const transaction = TxEnvelopeEip2930.from({
      to: accounts[1].address,
      nonce: 0n,
      chainId: 1,
      value: 0n,
      gasPrice: 0n,
      accessList: [],
    })

    const serialized = TxEnvelopeEip2930.serialize(transaction)

    expect(serialized).toEqual(
      '0x01dc018080809470997970c51812dc3a010c7d01b50e0d17dc79c88080c0',
    )
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual({
      chainId: 1,
      nonce: 0n,
      to: accounts[1].address,
      type: 'eip2930',
    })
  })

  test('minimal', () => {
    const transaction = TxEnvelopeEip2930.from({
      chainId: 1,
      nonce: 0n,
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction)
    expect(serialized).toEqual('0x01c801808080808080c0')
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual({
      chainId: 1,
      nonce: 0n,
      type: 'eip2930',
    })
  })

  test('minimal (w/ accessList & gasPrice)', () => {
    const transaction = TxEnvelopeEip2930.from({
      chainId: 1,
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          ],
        },
      ],
      gasPrice: Value.fromGwei('2'),
      nonce: 0n,
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction)
    expect(serialized).toEqual(
      '0x01f8450180847735940080808080f838f7940000000000000000000000000000000000000000e1a00000000000000000000000000000000000000000000000000000000000000001',
    )
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TxEnvelopeEip2930.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0x01f8650182031184773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('data', () => {
    const transaction_data = TxEnvelopeEip2930.from({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction_data)
    expect(serialized).toEqual(
      '0x01f865018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual(transaction_data)
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip2930.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TxEnvelopeEip2930.serialize(transaction, {
      signature,
    })
    expect(serialized).toEqual(
      '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe01a0dc7b3483c0b183823f07d77247c60678d861080acdc4fb8b9fd131770b475c40a040f16567391132746735aff4d5a3fa5ae42ff3d5d538e341870e0259dc40741a',
    )
    expect(TxEnvelopeEip2930.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  test('options: signature', () => {
    expect(
      TxEnvelopeEip2930.serialize(transaction, {
        signature: {
          r: '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          s: '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          yParity: 1,
        },
      }),
    ).toEqual(
      '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe01a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(
      TxEnvelopeEip2930.serialize(transaction, {
        signature: {
          r: '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          s: '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          yParity: 0,
        },
      }),
    ).toEqual(
      '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe80a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
  })
})

describe('toRpc', () => {
  test('default', () => {
    const transaction = TxEnvelopeEip2930.toRpc({
      chainId: 1,
      nonce: 0n,
      gas: 21000n,
      gasPrice: Value.fromGwei('10'),
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 1000000000000000000n,
      r: '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      s: '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      yParity: 0,
    })
    expect(transaction).toMatchInlineSnapshot(`
      {
        "chainId": "0x1",
        "data": undefined,
        "gas": "0x5208",
        "gasPrice": "0x2540be400",
        "nonce": "0x0",
        "r": "0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe",
        "s": "0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe",
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "0x1",
        "value": "0xde0b6b3a7640000",
        "yParity": "0x0",
      }
    `)
  })

  test('behavior: nullish', () => {
    const transaction = TxEnvelopeEip2930.toRpc({
      chainId: 1,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    })
    expect(transaction).toMatchInlineSnapshot(`
      {
        "chainId": "0x1",
        "data": undefined,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "0x1",
      }
    `)
  })

  test('behavior: network', async () => {
    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [accounts[0].address, 'pending'],
    })

    const transaction = TxEnvelopeEip2930.from({
      chainId: 1,
      nonce: BigInt(nonce),
      gas: 21000n,
      gasPrice: Value.fromGwei('10'),
      from: accounts[0].address,
      to: accounts[1].address,
      value: Value.fromEther('1'),
    })

    const rpc = TxEnvelopeEip2930.toRpc(transaction)

    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [rpc],
    })

    expect(hash).toBeDefined()

    const tx = await anvilMainnet.request({
      method: 'eth_getTransactionByHash',
      params: [hash],
    })

    expect({ ...tx, blockHash: null }).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "blockHash": null,
      "blockNumber": "0x12f2975",
      "chainId": "0x1",
      "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "gas": "0x5208",
      "gasPrice": "0x2540be400",
      "hash": "0x3abd5f1feb4598f71e8bce577a48b76a194e483d043888bfeaf59c4a603c926b",
      "input": "0x",
      "nonce": "0x297",
      "r": "0x65eb2e814e2d0bc71107740c694706e44264850a68421d1b02cd7342f41aee75",
      "s": "0x7c29b61014e58a6a2464ac5c48ec8c4135e4d95262355b634f57ff934caa52a",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "transactionIndex": "0x0",
      "type": "0x1",
      "v": "0x1",
      "value": "0xde0b6b3a7640000",
      "yParity": "0x1",
    }
  `)
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      TxEnvelopeEip2930.validate({
        chainId: 1,
        gasPrice: 69n,
      }),
    ).toBe(true)
    expect(
      TxEnvelopeEip2930.validate({
        chainId: 1,
        gasPrice: 2n ** 257n,
      }),
    ).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(TxEnvelopeEip2930)).toMatchInlineSnapshot(`
    [
      "serializedType",
      "type",
      "assert",
      "deserialize",
      "from",
      "getSignPayload",
      "hash",
      "serialize",
      "toRpc",
      "validate",
    ]
  `)
})
