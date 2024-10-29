import { Hex, Rlp, Secp256k1, TransactionEnvelopeEip1559, Value } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { anvilMainnet } from '../test/anvil.js'
import { accounts } from '../test/constants/accounts.js'

describe('assert', () => {
  test('fee cap too high', () => {
    expect(() =>
      TransactionEnvelopeEip1559.assert({
        maxFeePerGas: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })

  test('tip higher than fee cap', () => {
    expect(() =>
      TransactionEnvelopeEip1559.assert({
        maxFeePerGas: Value.fromGwei('10'),
        maxPriorityFeePerGas: Value.fromGwei('11'),
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TransactionEnvelope.TipAboveFeeCapError: The provided tip (`maxPriorityFeePerGas` = 11 gwei) cannot be higher than the fee cap (`maxFeePerGas` = 10 gwei).]',
    )
  })

  test('invalid chainId', () => {
    expect(() =>
      TransactionEnvelopeEip1559.assert({ chainId: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TransactionEnvelopeEip1559.assert({ to: '0x123', chainId: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0x123" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })
})

describe('deserialize', () => {
  const transaction = TransactionEnvelopeEip1559.from({
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
    chainId: 1,
    maxFeePerGas: Value.fromGwei('2'),
    maxPriorityFeePerGas: Value.fromGwei('2'),
  })

  test('default', () => {
    const serialized = TransactionEnvelopeEip1559.serialize(transaction)
    const deserialized = TransactionEnvelopeEip1559.deserialize(serialized)
    assertType<TransactionEnvelopeEip1559>(deserialized)
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TransactionEnvelopeEip1559.from({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction)
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelopeEip1559.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction_gas)
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction_gas,
    )
  })

  test('accessList', () => {
    const transaction_accessList = TransactionEnvelopeEip1559.from({
      ...transaction,
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ],
        },
      ],
    })
    const serialized = TransactionEnvelopeEip1559.serialize(
      transaction_accessList,
    )
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction_accessList,
    )
  })

  test('data', () => {
    const transaction_data = TransactionEnvelopeEip1559.from({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction_data)
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('signature', () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeEip1559.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction, {
      signature,
    })
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  describe('raw', () => {
    test('default', () => {
      const serialized = `0x02${Rlp.fromHex([
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
        '0x', // data
        '0x', // accessList
      ]).slice(2)}` as const
      expect(
        TransactionEnvelopeEip1559.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "eip1559",
          "value": 0n,
        }
      `)
    })

    test('empty sig', () => {
      const serialized = `0x02${Rlp.fromHex([
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
        '0x', // data
        '0x', // accessList
        '0x', // r
        '0x', // v
        '0x', // s
      ]).slice(2)}` as const
      expect(
        TransactionEnvelopeEip1559.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "r": 0n,
          "s": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "eip1559",
          "value": 0n,
          "yParity": 0,
        }
      `)
    })

    test('low sig coords', () => {
      const serialized = `0x02${Rlp.fromHex([
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
        '0x', // data
        '0x', // accessList
        '0x', // r
        Hex.fromNumber(69), // v
        Hex.fromNumber(420), // s
      ]).slice(2)}` as const
      expect(
        TransactionEnvelopeEip1559.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "r": 69n,
          "s": 420n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "eip1559",
          "value": 0n,
          "yParity": 0,
        }
      `)
    })
  })

  describe('errors', () => {
    test('invalid access list (invalid address)', () => {
      expect(() =>
        TransactionEnvelopeEip1559.deserialize(
          `0x02${Rlp.fromHex([
            Hex.fromNumber(1), // chainId
            Hex.fromNumber(0), // nonce
            Hex.fromNumber(1), // maxPriorityFeePerGas
            Hex.fromNumber(1), // maxFeePerGas
            Hex.fromNumber(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
            [
              [
                '0x',
                [
                  '0x0000000000000000000000000000000000000000000000000000000000000001',
                ],
              ],
            ], // accessList
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)

      expect(() =>
        TransactionEnvelopeEip1559.deserialize(
          `0x02${Rlp.fromHex([
            Hex.fromNumber(1), // chainId
            Hex.fromNumber(0), // nonce
            Hex.fromNumber(1), // maxPriorityFeePerGas
            Hex.fromNumber(1), // maxFeePerGas
            Hex.fromNumber(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
            [['0x123456', ['0x0']]], // accessList
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.InvalidLengthError: Hex value \`"0x0"\` is an odd length (1 nibbles).

      It must be an even length.]
    `)
    })

    test('invalid transaction (all missing)', () => {
      expect(() =>
        TransactionEnvelopeEip1559.deserialize(
          `0x02${Rlp.fromHex([]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.

      Serialized Transaction: "0x02c0"
      Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TransactionEnvelopeEip1559.deserialize(
          `0x02${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.

      Serialized Transaction: "0x02c20001"
      Missing Attributes: maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
    })

    test('invalid transaction (missing signature)', () => {
      expect(() =>
        TransactionEnvelopeEip1559.deserialize(
          `0x02${Rlp.fromHex([
            '0x',
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
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.

      Serialized Transaction: "0x02ca80808080808080808080"
      Missing Attributes: r, s]
    `)
    })
  })
})

describe('from', () => {
  test('default', () => {
    {
      const envelope = TransactionEnvelopeEip1559.from({
        chainId: 1,
        maxFeePerGas: 69420n,
        to: '0x0000000000000000000000000000000000000000',
      })
      expect(envelope).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "maxFeePerGas": 69420n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "eip1559",
      }
    `)
    }

    {
      const envelope = TransactionEnvelopeEip1559.from({
        chainId: 1,
        maxFeePerGas: 69420n,
        to: '0x0000000000000000000000000000000000000000',
      })
      const serialized = TransactionEnvelopeEip1559.serialize(envelope)
      const envelope2 = TransactionEnvelopeEip1559.from(serialized)
      expect(envelope2).toEqual(envelope)
    }

    {
      const envelope = TransactionEnvelopeEip1559.from({
        chainId: 1,
        maxFeePerGas: 69420n,
        to: '0x0000000000000000000000000000000000000000',
        r: 0n,
        s: 1n,
        yParity: 0,
      })
      const serialized = TransactionEnvelopeEip1559.serialize(envelope)
      const envelope2 = TransactionEnvelopeEip1559.from(serialized)
      expect(envelope2).toEqual(envelope)
    }
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const envelope = TransactionEnvelopeEip1559.from({
      chainId: 1,
      gas: 21000n,
      maxFeePerGas: 13000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      type: 'eip1559',
    })

    const hash = TransactionEnvelopeEip1559.hash(envelope, { presign: true })
    expect(hash).toMatchInlineSnapshot(
      `"0x1d099d1f25465b53e1e56e715e35d5daaaef6a9e9883ba21652eea7f411fffc7"`,
    )

    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })

    const envelope_signed = TransactionEnvelopeEip1559.from(envelope, {
      signature,
    })

    {
      const hash = TransactionEnvelopeEip1559.hash(envelope_signed)
      expect(hash).toMatchInlineSnapshot(
        `"0x57e6a86fac2dc4b827f6d77d869d625aebf88a71790a740bc859badf556d43c4"`,
      )
    }
    {
      const hash_presign =
        TransactionEnvelopeEip1559.getSignPayload(envelope_signed)
      expect(hash_presign).toEqual(hash)
    }
  })
})

describe('hash', () => {
  test('default', () => {
    const envelope = TransactionEnvelopeEip1559.from({
      chainId: 1,
      gas: 21000n,
      maxFeePerGas: 13000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      r: BigInt(
        '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
      ),
      s: BigInt(
        '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
      ),
      yParity: 0,
    })

    const hash = TransactionEnvelopeEip1559.hash(envelope)
    expect(hash).toMatchInlineSnapshot(
      `"0x57e6a86fac2dc4b827f6d77d869d625aebf88a71790a740bc859badf556d43c4"`,
    )
  })
})

describe('serialize', () => {
  const transaction = TransactionEnvelopeEip1559.from({
    chainId: 1,
    nonce: 785n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
    maxFeePerGas: Value.fromGwei('2'),
    maxPriorityFeePerGas: Value.fromGwei('2'),
  })

  test('default', async () => {
    const serialized = TransactionEnvelopeEip1559.serialize(transaction)
    assertType<TransactionEnvelopeEip1559.Serialized>(serialized)
    expect(serialized).toEqual(
      '0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0',
    )
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('default (all zeros)', () => {
    const transaction = TransactionEnvelopeEip1559.from({
      to: accounts[1].address,
      nonce: 0n,
      chainId: 1,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      value: 0n,
    })

    const serialized = TransactionEnvelopeEip1559.serialize(transaction)

    expect(serialized).toEqual(
      '0x02dd01808080809470997970c51812dc3a010c7d01b50e0d17dc79c88080c0',
    )
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual({
      chainId: 1,
      to: accounts[1].address,
      type: 'eip1559',
    })
  })

  test('minimal (w/ type)', () => {
    const transaction = TransactionEnvelopeEip1559.from({
      chainId: 1,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction)
    expect(serialized).toEqual('0x02c90180808080808080c0')
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('minimal (w/ maxFeePerGas)', () => {
    const transaction = TransactionEnvelopeEip1559.from({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction)
    expect(serialized).toEqual('0x02c90180800180808080c0')
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelopeEip1559.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0x02f101820311847735940084773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0',
    )
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction_gas,
    )
  })

  test('accessList', () => {
    const transaction_accessList = TransactionEnvelopeEip1559.from({
      ...transaction,
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ],
        },
      ],
    })
    const serialized = TransactionEnvelopeEip1559.serialize(
      transaction_accessList,
    )
    expect(serialized).toEqual(
      '0x02f88b0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f85bf859940000000000000000000000000000000000000000f842a00000000000000000000000000000000000000000000000000000000000000001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction_accessList,
    )
  })

  test('data', () => {
    const transaction_data = {
      ...transaction,
      data: '0x1234',
    } satisfies TransactionEnvelopeEip1559
    const serialized = TransactionEnvelopeEip1559.serialize(transaction_data)
    expect(serialized).toEqual(
      '0x02f10182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234c0',
    )
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeEip1559.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelopeEip1559.serialize(transaction, {
      signature,
    })
    expect(serialized).toEqual(
      '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c001a0ce18214ff9d06ecaacb61811f9d6dc2be922e8cebddeaf6df0b30d5c498f6d33a05f0487c6dbbf2139f7c705d8054dbb16ecac8ae6256ce2c4c6f2e7ef35b3a496',
    )
    expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  test('options: signature', () => {
    expect(
      TransactionEnvelopeEip1559.serialize(transaction, {
        signature: {
          r: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          s: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          yParity: 1,
        },
      }),
    ).toEqual(
      '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )

    expect(
      TransactionEnvelopeEip1559.serialize(transaction, {
        signature: {
          r: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          s: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          yParity: 0,
        },
      }),
    ).toEqual(
      '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )

    expect(
      TransactionEnvelopeEip1559.serialize(transaction, {
        signature: {
          r: 0n,
          s: 0n,
          yParity: 0,
        },
      }),
    ).toEqual(
      '0x02f20182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0808080',
    )
  })

  test('behavior: legacy signature', () => {
    const serialized = TransactionEnvelopeEip1559.serialize({
      ...transaction,
      r: 0n,
      s: 0n,
      v: 27,
    })
    const serialized2 = TransactionEnvelopeEip1559.serialize({
      ...transaction,
      r: 0n,
      s: 0n,
      yParity: 0,
    })
    expect(serialized).toEqual(serialized2)
  })

  test('behavior: network', async () => {
    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [accounts[0].address, 'pending'],
    })

    const transaction = TransactionEnvelopeEip1559.from({
      chainId: 1,
      nonce: BigInt(nonce),
      gas: 21000n,
      to: accounts[1].address,
      value: Value.fromEther('1'),
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeEip1559.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })

    const serialized_signed = TransactionEnvelopeEip1559.serialize(
      transaction,
      {
        signature,
      },
    )

    const hash = await anvilMainnet.request({
      method: 'eth_sendRawTransaction',
      params: [serialized_signed],
    })

    expect(hash).toMatchInlineSnapshot(
      `"0x01622b14f0eb2830d990e71dbac79267a233980df14d632e05e58e451c93bf5c"`,
    )

    const response = await anvilMainnet.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    })

    expect({ ...response, blockHash: null }).toMatchInlineSnapshot(`
    {
      "blobGasPrice": "0x1",
      "blockHash": null,
      "blockNumber": "0x12f2975",
      "contractAddress": null,
      "cumulativeGasUsed": "0x5208",
      "effectiveGasPrice": "0x45840214c",
      "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "gasUsed": "0x5208",
      "logs": [],
      "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "status": "0x1",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "transactionHash": "0x01622b14f0eb2830d990e71dbac79267a233980df14d632e05e58e451c93bf5c",
      "transactionIndex": "0x0",
      "type": "0x2",
    }
  `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    const transaction = TransactionEnvelopeEip1559.toRpc({
      chainId: 1,
      nonce: 0n,
      maxFeePerGas: 1000000000n,
      gas: 21000n,
      maxPriorityFeePerGas: 100000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 1000000000000000000n,
      r: 1n,
      s: 2n,
      yParity: 0,
    })
    expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": "0x01",
      "data": undefined,
      "gas": "0x5208",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x05f5e100",
      "nonce": "0x00",
      "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x2",
      "value": "0x0de0b6b3a7640000",
      "yParity": "0x0",
    }
  `)
  })

  test('behavior: nullish', () => {
    const transaction = TransactionEnvelopeEip1559.toRpc({
      chainId: 1,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    })
    expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": "0x01",
      "data": undefined,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x2",
    }
  `)
  })

  test('behavior: network', async () => {
    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [accounts[0].address, 'pending'],
    })

    const transaction = TransactionEnvelopeEip1559.from({
      chainId: 1,
      nonce: BigInt(nonce),
      gas: 21000n,
      from: accounts[0].address,
      to: accounts[1].address,
      value: Value.fromEther('1'),
    })

    const rpc = TransactionEnvelopeEip1559.toRpc(transaction)

    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [rpc],
    })

    expect(hash).toMatchInlineSnapshot(
      `"0x5446efae07c46266b79c1a3f6b45a60fa91c0b99d21804b3687fe0dedacbaf4c"`,
    )

    const tx = await anvilMainnet.request({
      method: 'eth_getTransactionByHash',
      params: [hash],
    })

    expect({ ...tx, blockHash: null }).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": null,
        "blockNumber": "0x12f2976",
        "chainId": "0x1",
        "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "gas": "0x5208",
        "gasPrice": "0x1c3c4d5e1",
        "hash": "0x5446efae07c46266b79c1a3f6b45a60fa91c0b99d21804b3687fe0dedacbaf4c",
        "input": "0x",
        "maxFeePerGas": "0x417d0b9e1",
        "maxPriorityFeePerGas": "0x0",
        "nonce": "0x298",
        "r": "0x94e61e799554e9303d0463523fba94c2ae1708f003b8716b0e7ef341a7ab98c7",
        "s": "0x17c69227e635b4715bc252e60bfe28feecef5fa3a4aa3da68180e73ab44a0472",
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "transactionIndex": "0x0",
        "type": "0x2",
        "v": "0x0",
        "value": "0xde0b6b3a7640000",
        "yParity": "0x0",
      }
    `)
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      TransactionEnvelopeEip1559.validate({
        chainId: 1,
        maxFeePerGas: 69n,
      }),
    ).toBe(true)
    expect(
      TransactionEnvelopeEip1559.validate({
        chainId: 1,
        maxFeePerGas: 2n ** 257n,
      }),
    ).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(TransactionEnvelopeEip1559)).toMatchInlineSnapshot(`
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
