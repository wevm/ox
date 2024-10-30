import { Hex, Rlp, Secp256k1, TransactionEnvelopeLegacy, Value } from 'ox'
import { assertType, describe, expect, expectTypeOf, test } from 'vitest'
import { anvilMainnet } from '../test/anvil.js'
import { accounts } from '../test/constants/accounts.js'

describe('assert', () => {
  test('fee cap too high', () => {
    expect(() =>
      TransactionEnvelopeLegacy.assert({
        gasPrice: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TransactionEnvelope.GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })

  test('invalid chainId', () => {
    expect(() =>
      TransactionEnvelopeLegacy.assert({ chainId: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TransactionEnvelopeLegacy.assert({ to: '0x123', chainId: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0x123" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })
})

describe('deserialize', () => {
  const transaction = TransactionEnvelopeLegacy.from({
    gasPrice: Value.fromGwei('2'),
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
  })

  test('default', () => {
    const serialized = TransactionEnvelopeLegacy.serialize(transaction)
    const deserialized = TransactionEnvelopeLegacy.deserialize(serialized)
    assertType<TransactionEnvelopeLegacy.TransactionEnvelopeLegacy>(
      deserialized,
    )
    expect(deserialized).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelopeLegacy.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction_gas)
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction_gas,
    )
  })

  test('data', () => {
    const transaction_data = TransactionEnvelopeLegacy.from({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction_data)
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('chainId', () => {
    const transaction_chainId = TransactionEnvelopeLegacy.from({
      ...transaction,
      chainId: 69,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction_chainId)
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction_chainId,
    )
  })

  test('signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeLegacy.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction, {
      signature,
    })
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
    {
      "gasPrice": 2000000000n,
      "nonce": 785n,
      "r": 49162359600332107255572924559512453493861388410495780496134469638986269765272n,
      "s": 23658591060807096482427659898336319664614845702773383989972841251496079269784n,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "legacy",
      "v": 28,
      "value": 1000000000000000000n,
      "yParity": 1,
    }
  `,
    )
  })

  test('signature', async () => {
    {
      const serialized = TransactionEnvelopeLegacy.serialize(transaction, {
        signature: {
          r: 1n,
          s: 0n,
          yParity: 0,
        },
      })
      expect(
        TransactionEnvelopeLegacy.deserialize(serialized),
      ).toMatchInlineSnapshot(
        `
      {
        "gasPrice": 2000000000n,
        "nonce": 785n,
        "r": 1n,
        "s": 0n,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
        "v": 27,
        "value": 1000000000000000000n,
        "yParity": 0,
      }
    `,
      )
    }

    {
      const serialized = TransactionEnvelopeLegacy.serialize(transaction, {
        signature: {
          r: 0n,
          s: 1n,
          yParity: 0,
        },
      })
      expect(
        TransactionEnvelopeLegacy.deserialize(serialized),
      ).toMatchInlineSnapshot(
        `
      {
        "gasPrice": 2000000000n,
        "nonce": 785n,
        "r": 0n,
        "s": 1n,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
        "v": 27,
        "value": 1000000000000000000n,
        "yParity": 0,
      }
    `,
      )
    }
  })

  test('signature + chainId', async () => {
    const transaction_chainId = TransactionEnvelopeLegacy.from({
      ...transaction,
      chainId: 69,
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeLegacy.getSignPayload(transaction_chainId),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(
      transaction_chainId,
      {
        signature,
      },
    )
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
    {
      "chainId": 69,
      "gasPrice": 2000000000n,
      "nonce": 785n,
      "r": 21377422632306986934234848369642217951872212572373694238667569216102361836592n,
      "s": 46566099151962357110521349825476283164605004096182178307881493582909309068838n,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "legacy",
      "v": 173,
      "value": 1000000000000000000n,
      "yParity": 0,
    }
  `,
    )
  })

  describe('raw', () => {
    test('default', () => {
      const serialized = Rlp.fromHex([
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // gasPrice
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
        '0x', // data
      ])
      expect(
        TransactionEnvelopeLegacy.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "gas": 1n,
          "gasPrice": 1n,
          "nonce": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "legacy",
          "value": 0n,
        }
      `)
    })

    test('empty sig', () => {
      const serialized = Rlp.fromHex([
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // gasPrice
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
        '0x', // data
        '0x', // v
        '0x', // r
        '0x', // s
      ])
      expect(
        TransactionEnvelopeLegacy.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "gas": 1n,
          "gasPrice": 1n,
          "nonce": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "legacy",
          "value": 0n,
        }
      `)
    })

    test('low sig coords', () => {
      const serialized = Rlp.fromHex([
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // gasPrice
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
        '0x', // data
        '0x1b', // v
        Hex.fromNumber(69), // r
        Hex.fromNumber(420), // s
      ])
      expect(
        TransactionEnvelopeLegacy.deserialize(serialized),
      ).toMatchInlineSnapshot(`
      {
        "gas": 1n,
        "gasPrice": 1n,
        "nonce": 0n,
        "r": 69n,
        "s": 420n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "legacy",
        "v": 27,
        "value": 0n,
        "yParity": 0,
      }
    `)
    })
  })

  describe('errors', () => {
    test('invalid transaction (all missing)', () => {
      expect(() =>
        TransactionEnvelopeLegacy.deserialize(Rlp.fromHex([])),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "legacy" was provided.

      Serialized Transaction: "0xc0"
      Missing Attributes: nonce, gasPrice, gas, to, value, data]
    `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TransactionEnvelopeLegacy.deserialize(Rlp.fromHex(['0x00', '0x01'])),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "legacy" was provided.

      Serialized Transaction: "0xc20001"
      Missing Attributes: gas, to, value, data]
    `)
    })

    test('invalid transaction (missing signature)', () => {
      expect(() =>
        TransactionEnvelopeLegacy.deserialize(
          Rlp.fromHex(['0x', '0x', '0x', '0x', '0x', '0x', '0x']),
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "legacy" was provided.

      Serialized Transaction: "0xc780808080808080"
      Missing Attributes: r, s]
    `)
    })

    test('invalid transaction (attribute overload)', () => {
      expect(() =>
        TransactionEnvelopeLegacy.deserialize(
          Rlp.fromHex([
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
          ]),
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "legacy" was provided.

      Serialized Transaction: "0xca80808080808080808080"]
    `)
    })

    test('invalid v', () => {
      expect(() =>
        TransactionEnvelopeLegacy.deserialize(
          Rlp.fromHex([
            Hex.fromNumber(0), // nonce
            Hex.fromNumber(1), // gasPrice
            Hex.fromNumber(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
            '0x', // v
            Hex.fromNumber(69), // r
            Hex.fromNumber(420), // s
          ]),
        ),
      ).toThrowErrorMatchingInlineSnapshot(
        '[Signature.InvalidVError: Value `0` is an invalid v value. v must be 27, 28 or >=35.]',
      )

      expect(() =>
        TransactionEnvelopeLegacy.deserialize(
          Rlp.fromHex([
            Hex.fromNumber(0), // nonce
            Hex.fromNumber(1), // gasPrice
            Hex.fromNumber(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
            Hex.fromNumber(35), // v
            Hex.fromNumber(69), // r
            Hex.fromNumber(420), // s
          ]),
        ),
      ).toThrowErrorMatchingInlineSnapshot(
        '[Signature.InvalidVError: Value `35` is an invalid v value. v must be 27, 28 or >=35.]',
      )
    })
  })
})

describe('from', () => {
  test('default', () => {
    {
      const envelope = TransactionEnvelopeLegacy.from({})
      expectTypeOf(
        envelope,
      ).toMatchTypeOf<TransactionEnvelopeLegacy.TransactionEnvelopeLegacy>()
      expect(envelope).toMatchInlineSnapshot(`
        {
          "type": "legacy",
        }
      `)
    }

    {
      const envelope = TransactionEnvelopeLegacy.from({
        to: '0x0000000000000000000000000000000000000000',
        value: 69n,
      })
      const serialized = TransactionEnvelopeLegacy.serialize(envelope)
      expect(TransactionEnvelopeLegacy.from(serialized)).toEqual(envelope)
    }

    {
      const envelope = TransactionEnvelopeLegacy.from({
        chainId: 1,
        to: '0x0000000000000000000000000000000000000000',
        value: 69n,
        r: 0n,
        s: 1n,
        v: 37,
      })
      const serialized = TransactionEnvelopeLegacy.serialize(envelope)
      const envelope2 = TransactionEnvelopeLegacy.from(serialized)
      expect(envelope2).toEqual({ ...envelope, yParity: 0 })
    }
  })

  test('options: signature', () => {
    const envelope = TransactionEnvelopeLegacy.from(
      {
        to: '0x0000000000000000000000000000000000000000',
        value: 69n,
        type: 'legacy',
      },
      {
        signature: {
          r: 0n,
          s: 1n,
          yParity: 1,
        },
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "r": 0n,
        "s": 1n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "legacy",
        "v": 28,
        "value": 69n,
        "yParity": 1,
      }
    `)
    const serialized = TransactionEnvelopeLegacy.serialize(envelope)
    const envelope2 = TransactionEnvelopeLegacy.from(serialized)
    expect(envelope2).toEqual(envelope)
    const envelope3 = TransactionEnvelopeLegacy.from(serialized, {
      signature: {
        r: 1n,
        s: 0n,
        yParity: 1,
      },
    })
    expect(envelope3).toEqual({ ...envelope, r: 1n, s: 0n, v: 28 })
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const envelope = TransactionEnvelopeLegacy.from({
      chainId: 1,
      gas: 21000n,
      gasPrice: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      type: 'legacy',
    })

    const hash = TransactionEnvelopeLegacy.hash(envelope, { presign: true })
    expect(hash).toMatchInlineSnapshot(
      `"0x4c1dec0d90aa1a17cb0aa735b5550e43a1bd27cd1cacb8987522576fa6220e46"`,
    )

    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeLegacy.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })

    const envelope_signed = TransactionEnvelopeLegacy.from(envelope, {
      signature,
    })

    {
      const hash = TransactionEnvelopeLegacy.hash(envelope_signed)
      expect(hash).toMatchInlineSnapshot(
        `"0x882958af32ef451898e54afcaa1c5bb56e5dff1bf47ac9d1b47751bd0b6c8ec8"`,
      )
    }
    {
      const hash_presign =
        TransactionEnvelopeLegacy.getSignPayload(envelope_signed)
      expect(hash_presign).toEqual(hash)
    }
  })
})

describe('hash', () => {
  test('default', () => {
    const envelope = TransactionEnvelopeLegacy.from({
      chainId: 1,
      gas: 21000n,
      gasPrice: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      r: BigInt(
        '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
      ),
      s: BigInt(
        '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
      ),
      v: 27,
    })

    const hash = TransactionEnvelopeLegacy.hash(envelope)
    expect(hash).toMatchInlineSnapshot(
      `"0x5e427e088ae00b084b41e198c52440aa43b2d6f8f1f01246fd25d4e9b6ebfdab"`,
    )
  })
})

describe('serialize', () => {
  const transaction = TransactionEnvelopeLegacy.from({
    gasPrice: Value.fromGwei('2'),
    nonce: 785n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
  })

  test('default', () => {
    const serialized = TransactionEnvelopeLegacy.serialize(transaction)
    assertType<TransactionEnvelopeLegacy.Serialized>(serialized)
    expect(serialized).toEqual(
      '0xe88203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080',
    )
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('default (all zeros)', () => {
    const transaction = TransactionEnvelopeLegacy.from({
      to: accounts[1].address,
      nonce: 0n,
      value: 0n,
      gas: 0n,
      gasPrice: 0n,
    })

    const serialized = TransactionEnvelopeLegacy.serialize(transaction)

    expect(serialized).toEqual(
      '0xda8080809470997970c51812dc3a010c7d01b50e0d17dc79c88080',
    )
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
      {
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
      }
    `,
    )
  })

  test('minimal', () => {
    const transaction = TransactionEnvelopeLegacy.from({})
    const serialized = TransactionEnvelopeLegacy.serialize(transaction)
    expect(serialized).toEqual('0xc6808080808080')
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
      {
        "type": "legacy",
      }
    `,
    )
  })

  test('minimal (w/ gasPrice)', () => {
    const transaction = TransactionEnvelopeLegacy.from({
      gasPrice: Value.fromGwei('2'),
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction)
    expect(serialized).toEqual('0xca80847735940080808080')
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelopeLegacy.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0xea82031184773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080',
    )
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction_gas,
    )
  })

  test('data', () => {
    const transaction_gas = TransactionEnvelopeLegacy.from({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0xea8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234',
    )
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction_gas,
    )
  })

  test('chainId', () => {
    const transaction_chainId = TransactionEnvelopeLegacy.from({
      ...transaction,
      chainId: 69,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction_chainId)
    expect(serialized).toEqual(
      '0xeb8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080458080',
    )
    expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
      transaction_chainId,
    )
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeLegacy.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(transaction, {
      signature,
    })
    expect(serialized).toEqual(
      '0xf86b8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000801ca06cb0e8d21e5baf998fb9a05f47acd83692dc148f90b81b332a152f020da0ae98a0344e49bacb1ef7af7c2ffed9e88d3f0ae0aa4945c9da0a660a03717dd5621f98',
    )
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
    {
      "gasPrice": 2000000000n,
      "nonce": 785n,
      "r": 49162359600332107255572924559512453493861388410495780496134469638986269765272n,
      "s": 23658591060807096482427659898336319664614845702773383989972841251496079269784n,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "legacy",
      "v": 28,
      "value": 1000000000000000000n,
      "yParity": 1,
    }
  `,
    )
  })

  test('options: signature', () => {
    expect(
      TransactionEnvelopeLegacy.serialize(transaction, {
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
      '0xf86b8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000801ca060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(
      TransactionEnvelopeLegacy.serialize(transaction, {
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
      '0xf86b8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000801ba060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
  })

  test('behavior: signature + chainId', async () => {
    const transaction_chainId = TransactionEnvelopeLegacy.from({
      ...transaction,
      chainId: 69,
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeLegacy.getSignPayload(transaction_chainId),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelopeLegacy.serialize(
      transaction_chainId,
      {
        signature,
      },
    )
    expect(serialized).toEqual(
      '0xf86c8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a76400008081ada02f43314322cf4c5dd645b028aa0b0dadff0fb73c41a6f0620ff1dfb11601ac30a066f37a65e139fa4b6df33a42ab5ccaeaa7a109382e7430caefd1deee63962626',
    )
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
    {
      "chainId": 69,
      "gasPrice": 2000000000n,
      "nonce": 785n,
      "r": 21377422632306986934234848369642217951872212572373694238667569216102361836592n,
      "s": 46566099151962357110521349825476283164605004096182178307881493582909309068838n,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "legacy",
      "v": 173,
      "value": 1000000000000000000n,
      "yParity": 0,
    }
  `,
    )
  })

  test('behavior: inferred chainId', () => {
    {
      const transaction = TransactionEnvelopeLegacy.from({
        gas: 51627n,
        gasPrice: 3000000000n,
        hash: '0x3eaa88a766e82cbe53c95218ab4c3cf316325802b5f75d086b5121007b918e92',
        nonce: 117n,
        to: '0x55d398326f99059ff775485246999027b3197955',
        value: 0n,
        v: 84475,
        r: BigInt(
          '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
        ),
        s: BigInt(
          '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
        ),
      })
      expect(
        TransactionEnvelopeLegacy.serialize(transaction),
      ).toMatchInlineSnapshot(
        '"0xf8667584b2d05e0082c9ab9455d398326f99059ff775485246999027b31979558080830149fba073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }

    {
      const transaction = TransactionEnvelopeLegacy.from({
        gas: 51627n,
        gasPrice: 3000000000n,
        hash: '0x3eaa88a766e82cbe53c95218ab4c3cf316325802b5f75d086b5121007b918e92',
        nonce: 117n,
        to: '0x55d398326f99059ff775485246999027b3197955',
        value: 0n,
        v: 84476,
        r: BigInt(
          '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
        ),
        s: BigInt(
          '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
        ),
      })
      expect(
        TransactionEnvelopeLegacy.serialize(transaction),
      ).toMatchInlineSnapshot(
        '"0xf8667584b2d05e0082c9ab9455d398326f99059ff775485246999027b31979558080830149fca073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }

    {
      const transaction = TransactionEnvelopeLegacy.from({
        gas: 51627n,
        gasPrice: 3000000000n,
        hash: '0x3eaa88a766e82cbe53c95218ab4c3cf316325802b5f75d086b5121007b918e92',
        nonce: 117n,
        to: '0x55d398326f99059ff775485246999027b3197955',
        transactionIndex: null,
        value: 0n,
        type: 'legacy',
        v: 35,
        r: BigInt(
          '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
        ),
        s: BigInt(
          '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
        ),
      })
      expect(
        TransactionEnvelopeLegacy.serialize(transaction),
      ).toMatchInlineSnapshot(
        '"0xf8637584b2d05e0082c9ab9455d398326f99059ff775485246999027b319795580801ba073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }

    {
      const transaction = TransactionEnvelopeLegacy.from({
        gas: 51627n,
        gasPrice: 3000000000n,
        hash: '0x3eaa88a766e82cbe53c95218ab4c3cf316325802b5f75d086b5121007b918e92',
        nonce: 117n,
        to: '0x55d398326f99059ff775485246999027b3197955',
        transactionIndex: null,
        value: 0n,
        type: 'legacy',
        v: 36,
        r: BigInt(
          '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
        ),
        s: BigInt(
          '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
        ),
      })
      expect(
        TransactionEnvelopeLegacy.serialize(transaction),
      ).toMatchInlineSnapshot(
        '"0xf8637584b2d05e0082c9ab9455d398326f99059ff775485246999027b319795580801ca073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }
  })

  test('behavior: zeroish sig coords', () => {
    const serialized = TransactionEnvelopeLegacy.serialize({
      chainId: 17000,
      gas: BigInt('0x52080'),
      gasPrice: 0n,
      nonce: 0n,
      r: 0n,
      s: 0n,
      v: 0,
      to: '0xc000000000000000000000000000000000000000',
      type: 'legacy',
      value: BigInt('0x0'),
    })
    expect(serialized).toEqual(
      '0xe280808305208094c00000000000000000000000000000000000000080808284d88080',
    )
  })

  test('error: invalid v', () => {
    expect(() =>
      TransactionEnvelopeLegacy.serialize({
        ...transaction,
        r: BigInt(
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ),
        s: BigInt(
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ),
        v: 29,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Signature.InvalidVError: Value `29` is an invalid v value. v must be 27, 28 or >=35.]',
    )
  })
})

describe('toRpc', () => {
  test('default', () => {
    const transaction = TransactionEnvelopeLegacy.toRpc({
      chainId: 1,
      nonce: 0n,
      gas: 21000n,
      gasPrice: Value.fromGwei('10'),
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
      "gasPrice": "0x02540be400",
      "nonce": "0x00",
      "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x0",
      "v": "0x1b",
      "value": "0x0de0b6b3a7640000",
      "yParity": "0x0",
    }
  `)
  })

  test('behavior: nullish', () => {
    const transaction = TransactionEnvelopeLegacy.toRpc({
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    })
    expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": undefined,
      "data": undefined,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x0",
    }
  `)
  })

  test('behavior: network', async () => {
    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [accounts[0].address, 'pending'],
    })

    const transaction = TransactionEnvelopeLegacy.from({
      chainId: 1,
      nonce: BigInt(nonce),
      gas: 21000n,
      gasPrice: Value.fromGwei('10'),
      from: accounts[0].address,
      to: accounts[1].address,
      value: Value.fromEther('1'),
    })

    const rpc = TransactionEnvelopeLegacy.toRpc(transaction)

    const hash = await anvilMainnet.request({
      method: 'eth_sendTransaction',
      params: [rpc],
    })

    expect(hash).toMatchInlineSnapshot(
      `"0x431d828c5cfb696bd4d80214e89bcaa36f6ed8e8c13e9e3bcc485a9966759a54"`,
    )

    const tx = await anvilMainnet.request({
      method: 'eth_getTransactionByHash',
      params: [hash],
    })

    expect({ ...tx, blockHash: null }).toMatchInlineSnapshot(`
    {
      "blockHash": null,
      "blockNumber": "0x12f2975",
      "chainId": "0x1",
      "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "gas": "0x5208",
      "gasPrice": "0x2540be400",
      "hash": "0x431d828c5cfb696bd4d80214e89bcaa36f6ed8e8c13e9e3bcc485a9966759a54",
      "input": "0x",
      "nonce": "0x297",
      "r": "0x221b7f859c35a3f54defb3c29ad2f456a08f4acd3cbddda988a49d8803457655",
      "s": "0x243e08c40d4f672d37712b579481bf4324464a72a5fcba033aebf474fb65382b",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "transactionIndex": "0x0",
      "type": "0x0",
      "v": "0x26",
      "value": "0xde0b6b3a7640000",
    }
  `)
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      TransactionEnvelopeLegacy.validate({
        chainId: 1,
        gasPrice: 69n,
      }),
    ).toBe(true)
    expect(
      TransactionEnvelopeLegacy.validate({
        chainId: 1,
        gasPrice: 2n ** 257n,
      }),
    ).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(TransactionEnvelopeLegacy)).toMatchInlineSnapshot(`
    [
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
