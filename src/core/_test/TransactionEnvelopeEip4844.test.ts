import { Blobs, Hex, Rlp, Secp256k1, TxEnvelopeEip4844, Value } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'
import { kzg } from '../../../test/kzg.js'
import { anvilMainnet } from '../../../test/prool.js'

describe('assert', () => {
  test('empty blobs', () => {
    expect(() =>
      TxEnvelopeEip4844.assert({
        blobVersionedHashes: [],
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Blobs.EmptyBlobVersionedHashesError: Blob versioned hashes must not be empty.]',
    )
  })

  test('invalid blob length', () => {
    expect(() =>
      TxEnvelopeEip4844.assert({
        blobVersionedHashes: ['0xcafebabe'],
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Blobs.InvalidVersionedHashSizeError: Versioned hash "0xcafebabe" size is invalid.

    Expected: 32
    Received: 4]
  `)
  })

  test('invalid blob version', () => {
    expect(() =>
      TxEnvelopeEip4844.assert({
        blobVersionedHashes: [
          '0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
        ],
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Blobs.InvalidVersionedHashVersionError: Versioned hash "0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe" version is invalid.

    Expected: 1
    Received: 202]
  `)
  })

  test('fee cap too high', () => {
    expect(() =>
      TxEnvelopeEip4844.assert({
        blobVersionedHashes: [
          '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
        ],
        maxFeePerGas: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })
})

describe('deserialize', () => {
  const blobs = Blobs.from(Hex.fromString('abcd'))
  const sidecars = Blobs.toSidecars(blobs, { kzg })
  const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
  const transaction = TxEnvelopeEip4844.from({
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
    chainId: 1,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
    maxFeePerBlobGas: Value.fromGwei('2'),
    blobVersionedHashes,
  })

  test('default', () => {
    const serialized = TxEnvelopeEip4844.serialize(transaction)
    const deserialized = TxEnvelopeEip4844.deserialize(serialized)
    assertType<TxEnvelopeEip4844.TxEnvelopeEip4844>(deserialized)
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TxEnvelopeEip4844.from({
      chainId: 1,
      blobVersionedHashes: [
        '0x01adbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      ],
      nonce: 0n,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction)
    const deserialized = TxEnvelopeEip4844.deserialize(serialized)
    expect(deserialized).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TxEnvelopeEip4844.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction_gas)
    const deserialized = TxEnvelopeEip4844.deserialize(serialized)
    assertType<TxEnvelopeEip4844.TxEnvelopeEip4844>(deserialized)
    expect(deserialized).toEqual(transaction_gas)
  })

  test('accessList', () => {
    const transaction_accessList = TxEnvelopeEip4844.from({
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
    const serialized = TxEnvelopeEip4844.serialize(transaction_accessList)
    const deserialized = TxEnvelopeEip4844.deserialize(serialized)
    assertType<TxEnvelopeEip4844.TxEnvelopeEip4844>(deserialized)
    expect(deserialized).toEqual(transaction_accessList)
  })

  test('data', () => {
    const transaction_data = TxEnvelopeEip4844.from({
      ...transaction,
      data: '0xdeadbeef',
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction_data)
    const deserialized = TxEnvelopeEip4844.deserialize(serialized)
    assertType<TxEnvelopeEip4844.TxEnvelopeEip4844>(deserialized)
    expect(deserialized).toEqual(transaction_data)
  })

  test('sidecars', () => {
    const transaction_sidecars = TxEnvelopeEip4844.from({
      ...transaction,
      sidecars,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction_sidecars)
    const deserialized = TxEnvelopeEip4844.deserialize(serialized)
    assertType<TxEnvelopeEip4844.TxEnvelopeEip4844>(deserialized)
    expect(deserialized).toEqual(transaction_sidecars)
  })

  test('signature', async () => {
    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip4844.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction, {
      sidecars,
      signature,
    })
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
      sidecars,
    })
  })

  describe('errors', () => {
    test('invalid access list (invalid address)', () => {
      expect(() =>
        TxEnvelopeEip4844.deserialize(
          `0x03${Rlp.fromHex([
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
            '0x', // maxFeePerBlobGas,
            ['0x'], // blobVersionedHashes
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)

      expect(() =>
        TxEnvelopeEip4844.deserialize(
          `0x03${Rlp.fromHex([
            Hex.fromNumber(1), // chainId
            Hex.fromNumber(0), // nonce
            Hex.fromNumber(1), // maxPriorityFeePerGas
            Hex.fromNumber(1), // maxFeePerGas
            Hex.fromNumber(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
            [['0x123456', ['0x0']]], // accessList
            '0x', // maxFeePerBlobGas,
            ['0x'], // blobVersionedHashes
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [Address.InvalidAddressError: Address "0x123456" is invalid.

        Details: Address is not a 20 byte (40 hexadecimal character) value.]
      `)
    })

    test('invalid transaction (all missing)', () => {
      expect(() =>
        TxEnvelopeEip4844.deserialize(`0x03${Rlp.fromHex([]).slice(2)}`),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip4844" was provided.

      Serialized Transaction: "0x03c0"
      Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TxEnvelopeEip4844.deserialize(
          `0x03${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip4844" was provided.

      Serialized Transaction: "0x03c20001"
      Missing Attributes: maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
    })

    test('invalid transaction (missing signature)', () => {
      expect(() =>
        TxEnvelopeEip4844.deserialize(
          `0x03${Rlp.fromHex([
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
            '0x',
            '0x',
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip4844" was provided.

      Serialized Transaction: "0x03cc808080808080808080808080"
      Missing Attributes: r, s]
    `)
    })
  })
})

describe('from', () => {
  test('default', () => {
    {
      const envelope = TxEnvelopeEip4844.from({
        blobVersionedHashes: [
          '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
        ],
        chainId: 1,
        nonce: 0n,
      })
      expect(envelope).toMatchInlineSnapshot(`
        {
          "blobVersionedHashes": [
            "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
          ],
          "chainId": 1,
          "nonce": 0n,
          "type": "eip4844",
        }
      `)
      const serialized = TxEnvelopeEip4844.serialize(envelope)
      const envelope2 = TxEnvelopeEip4844.from(serialized)
      expect(envelope2).toEqual(envelope)
    }

    {
      const envelope = TxEnvelopeEip4844.from({
        blobVersionedHashes: [
          '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
        ],
        chainId: 1,
        nonce: 0n,
        r: 0n,
        s: 1n,
        yParity: 0,
      })
      expect(envelope).toMatchInlineSnapshot(`
        {
          "blobVersionedHashes": [
            "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
          ],
          "chainId": 1,
          "nonce": 0n,
          "r": 0n,
          "s": 1n,
          "type": "eip4844",
          "yParity": 0,
        }
      `)
      const serialized = TxEnvelopeEip4844.serialize(envelope)
      const envelope2 = TxEnvelopeEip4844.from(serialized)
      expect(envelope2).toEqual(envelope)
    }
  })

  test('options: signature', () => {
    const envelope = TxEnvelopeEip4844.from(
      {
        blobVersionedHashes: [
          '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
        ],
        chainId: 1,
        nonce: 0n,
      },
      {
        signature: {
          r: 0n,
          s: 1n,
          yParity: 0,
        },
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [
          "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        ],
        "chainId": 1,
        "nonce": 0n,
        "r": 0n,
        "s": 1n,
        "type": "eip4844",
        "yParity": 0,
      }
    `)
    const serialized = TxEnvelopeEip4844.serialize(envelope)
    const envelope2 = TxEnvelopeEip4844.from(serialized)
    expect(envelope2).toEqual(envelope)
  })
})

describe('from', () => {
  test('default', () => {
    const envelope = TxEnvelopeEip4844.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
      gas: 21000n,
      maxFeePerGas: 13000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      type: 'eip4844',
    })

    const hash = TxEnvelopeEip4844.hash(envelope, { presign: true })
    expect(hash).toMatchInlineSnapshot(
      `"0xd5c811a922a14455151761e77bcc84bf590bb8dbf2d9a79d4c890f561a6dcd39"`,
    )

    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip4844.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })

    const envelope_signed = TxEnvelopeEip4844.from(envelope, {
      signature,
    })

    {
      const hash = TxEnvelopeEip4844.hash(envelope_signed)
      expect(hash).toMatchInlineSnapshot(
        `"0xfae853c3fefc9481eb674943ddb34dca24c2959f26d2ce6917d45c8faad684a8"`,
      )
    }
    {
      const hash_presign = TxEnvelopeEip4844.getSignPayload(envelope_signed)
      expect(hash_presign).toEqual(hash)
    }
  })
})

describe('hash', () => {
  test('default', () => {
    const envelope = TxEnvelopeEip4844.from({
      blobVersionedHashes: [
        '0x0100000000000000000000000000000000000000000000000000000000000000',
      ],
      chainId: 1,
      gas: 21000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      type: 'eip4844',
      r: BigInt(
        '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
      ),
      s: BigInt(
        '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
      ),
      yParity: 0,
    })

    const hash = TxEnvelopeEip4844.hash(envelope)
    expect(hash).toMatchInlineSnapshot(
      `"0xf3920f47c878feb9c81f159612c8a324fbd7dbf82ec937bf348e3d42e712a03d"`,
    )
  })
})

describe('serialize', () => {
  const blobs = Blobs.from(Hex.fromString('abcd'))
  const sidecars = Blobs.toSidecars(blobs, { kzg })
  const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
  const transaction = TxEnvelopeEip4844.from({
    chainId: 1,
    nonce: 785n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
    blobVersionedHashes,
  })

  test('default', () => {
    const serialized = TxEnvelopeEip4844.serialize(transaction)
    assertType<TxEnvelopeEip4844.Serialized>(serialized)
    expect(serialized).toEqual(
      '0x03f84a018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261',
    )
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TxEnvelopeEip4844.from({
      blobVersionedHashes,
      chainId: 1,
      nonce: 0n,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x03ec0180808080808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
    )
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual(transaction)
  })

  test('fees', () => {
    const transaction = TxEnvelopeEip4844.from({
      chainId: 1,
      blobVersionedHashes,
      maxFeePerBlobGas: Value.fromGwei('20'),
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('1'),
      nonce: 0n,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x03f83a0180843b9aca008504a817c80080808080c08504a817c800e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
    )
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual(transaction)
  })

  test('fees', () => {
    const transaction = TxEnvelopeEip4844.from({
      chainId: 1,
      blobVersionedHashes,
      gas: 69420n,
      nonce: 0n,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x03ef0180808083010f2c808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
    )
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual(transaction)
  })

  test('no blobVersionedHashes', () => {
    // @ts-expect-error
    const transaction = TxEnvelopeEip4844.from({
      chainId: 1,
      nonce: 0n,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(`"0x03cb0180808080808080c080c0"`)
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip4844.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction, {
      signature,
    })
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  test('options: signature', () => {
    expect(
      TxEnvelopeEip4844.serialize(transaction, {
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
      '0x03f88d018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed8026101a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(
      TxEnvelopeEip4844.serialize(
        transaction,

        {
          signature: {
            r: BigInt(
              '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
            ),
            s: BigInt(
              '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
            ),
            yParity: 0,
          },
        },
      ),
    ).toEqual(
      '0x03f88d018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed8026180a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
  })

  test('options: sidecars', () => {
    const serialized = TxEnvelopeEip4844.serialize(transaction, {
      sidecars,
    })
    assertType<TxEnvelopeEip4844.Serialized>(serialized)
    expect(serialized).toMatchSnapshot()
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual({
      ...transaction,
      sidecars,
    })
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip4844.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TxEnvelopeEip4844.serialize(transaction, {
      signature,
      sidecars,
    })
    expect(TxEnvelopeEip4844.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
      sidecars,
    })
  })

  test('behavior: network', async () => {
    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [accounts[0].address, 'pending'],
    })

    const blobs = Blobs.from('0xdeadbeef')
    const sidecars = Blobs.toSidecars(blobs, { kzg })
    const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)

    const transaction = TxEnvelopeEip4844.from({
      blobVersionedHashes,
      chainId: 1,
      nonce: BigInt(nonce),
      gas: 1_000_000n,
      to: accounts[1].address,
      value: Value.fromEther('1'),
      maxFeePerBlobGas: Value.fromGwei('30'),
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TxEnvelopeEip4844.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })

    const serialized_signed = TxEnvelopeEip4844.serialize(transaction, {
      sidecars,
      signature,
    })

    const hash = await anvilMainnet.request({
      method: 'eth_sendRawTransaction',
      params: [serialized_signed],
    })

    expect(hash).toBeDefined()

    await anvilMainnet.request({
      method: 'anvil_mine',
      params: ['0x1', '0x0'],
    })

    const tx = await anvilMainnet.request({
      method: 'eth_getTransactionByHash',
      params: [hash],
    })

    expect(tx).toMatchObject({
      accessList: [],
      blobVersionedHashes: [
        '0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09',
      ],
      chainId: '0x1',
      commitments: [
        '0xb3d3f2a683d9cd83a03f1727d0fc21970157d5de4ba4afb0f86436ccd117768b2c1340ffe83533dbdfb060e8fb94e8a3',
      ],
      from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      gas: '0xf4240',
      input: '0x',
      maxFeePerBlobGas: '0x6fc23ac00',
      maxFeePerGas: '0x4a817c800',
      maxPriorityFeePerGas: '0x2540be400',
      proofs: [
        '0xb2127959bc7499de4dbcbbb994c7e833683fe4ce21bc37c84c5727c2aa9d89bb7dd2c9b345d6f2c2f7f182ee8f9c4e1e',
      ],
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      transactionIndex: '0x0',
      type: '0x3',
      value: '0xde0b6b3a7640000',
    })

    const receipt = await anvilMainnet.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    })

    expect(receipt).toMatchObject({
      blobGasPrice: '0x1',
      blobGasUsed: '0x20000',
      blockNumber: '0x12f2975',
      contractAddress: null,
      cumulativeGasUsed: '0x5208',
      from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      gasUsed: '0x5208',
      logs: [],
      status: '0x1',
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      transactionIndex: '0x0',
      type: '0x3',
    })
  })
})

describe('toRpc', () => {
  const blobs = Blobs.from('0xdeadbeef')
  const blobVersionedHashes = Blobs.toVersionedHashes(blobs, { kzg })

  test('default', () => {
    const transaction = TxEnvelopeEip4844.toRpc({
      blobVersionedHashes,
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
        "blobVersionedHashes": [
          "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
        ],
        "chainId": "0x1",
        "data": undefined,
        "gas": "0x5208",
        "maxFeePerGas": "0x3b9aca00",
        "maxPriorityFeePerGas": "0x5f5e100",
        "nonce": "0x0",
        "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "0x3",
        "value": "0xde0b6b3a7640000",
        "yParity": "0x0",
      }
    `)
  })

  test('behavior: nullish', () => {
    const transaction = TxEnvelopeEip4844.toRpc({
      blobVersionedHashes,
      chainId: 1,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    })
    expect(transaction).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [
          "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
        ],
        "chainId": "0x1",
        "data": undefined,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "0x3",
      }
    `)
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      TxEnvelopeEip4844.validate({
        blobVersionedHashes: [
          '0x0100000000000000000000000000000000000000000000000000000000000000',
        ],
        chainId: 1,
      }),
    ).toBe(true)
    expect(
      TxEnvelopeEip4844.validate({
        blobVersionedHashes: [],
        chainId: 1,
      }),
    ).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(TxEnvelopeEip4844)).toMatchInlineSnapshot(`
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
