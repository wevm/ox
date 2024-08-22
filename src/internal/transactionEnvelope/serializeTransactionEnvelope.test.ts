// TODO: Add `eth_sendRawTransaction` tests.

import { Blobs, Hex, Secp256k1, TransactionEnvelope, Value } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'
import { kzg } from '../../../test/kzg.js'

describe('legacy', () => {
  const transaction = TransactionEnvelope.fromLegacy({
    gasPrice: Value.fromGwei('2'),
    nonce: 785n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
  })

  test('default', () => {
    const serialized = TransactionEnvelope.serializeLegacy(transaction)
    assertType<TransactionEnvelope.SerializedLegacy>(serialized)
    expect(serialized).toEqual(
      '0xe88203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('default (all zeros)', () => {
    const transaction = TransactionEnvelope.fromLegacy({
      to: accounts[1].address,
      nonce: 0n,
      value: 0n,
      gas: 0n,
      gasPrice: 0n,
    })

    const serialized = TransactionEnvelope.serialize(transaction)

    expect(serialized).toEqual(
      '0xda8080809470997970c51812dc3a010c7d01b50e0d17dc79c88080',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toMatchInlineSnapshot(
      `
      {
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
      }
    `,
    )
  })

  test('minimal', () => {
    const transaction = TransactionEnvelope.fromLegacy({})
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(serialized).toEqual('0xc6808080808080')
    expect(TransactionEnvelope.deserialize(serialized)).toMatchInlineSnapshot(
      `
      {
        "type": "legacy",
      }
    `,
    )
  })

  test('minimal (w/ gasPrice)', () => {
    const transaction = TransactionEnvelope.fromLegacy({
      gasPrice: Value.fromGwei('2'),
    })
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(serialized).toEqual('0xca80847735940080808080')
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelope.fromLegacy({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0xea82031184773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('data', () => {
    const transaction_gas = TransactionEnvelope.fromLegacy({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0xea8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('chainId', () => {
    const transaction_chainId = TransactionEnvelope.fromLegacy({
      ...transaction,
      chainId: 69,
    })
    const serialized = TransactionEnvelope.serialize(transaction_chainId)
    expect(serialized).toEqual(
      '0xeb8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080458080',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_chainId,
    )
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.hash(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, { signature })
    expect(serialized).toEqual(
      '0xf86b8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000801ca06cb0e8d21e5baf998fb9a05f47acd83692dc148f90b81b332a152f020da0ae98a0344e49bacb1ef7af7c2ffed9e88d3f0ae0aa4945c9da0a660a03717dd5621f98',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toMatchInlineSnapshot(
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
      }
    `,
    )
  })

  test('options: signature', () => {
    expect(
      TransactionEnvelope.serialize(transaction, {
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
      TransactionEnvelope.serialize(transaction, {
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
    const transaction_chainId = TransactionEnvelope.fromLegacy({
      ...transaction,
      chainId: 69,
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.hash(transaction_chainId),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction_chainId, {
      signature,
    })
    expect(serialized).toEqual(
      '0xf86c8203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a76400008081ada02f43314322cf4c5dd645b028aa0b0dadff0fb73c41a6f0620ff1dfb11601ac30a066f37a65e139fa4b6df33a42ab5ccaeaa7a109382e7430caefd1deee63962626',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toMatchInlineSnapshot(
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
      }
    `,
    )
  })

  test('behavior: inferred chainId', () => {
    {
      const transaction = TransactionEnvelope.fromLegacy({
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
      expect(TransactionEnvelope.serialize(transaction)).toMatchInlineSnapshot(
        '"0xf8667584b2d05e0082c9ab9455d398326f99059ff775485246999027b31979558080830149fba073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }

    {
      const transaction = TransactionEnvelope.fromLegacy({
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
      expect(TransactionEnvelope.serialize(transaction)).toMatchInlineSnapshot(
        '"0xf8667584b2d05e0082c9ab9455d398326f99059ff775485246999027b31979558080830149fca073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }

    {
      const transaction = TransactionEnvelope.fromLegacy({
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
      expect(TransactionEnvelope.serialize(transaction)).toMatchInlineSnapshot(
        '"0xf8637584b2d05e0082c9ab9455d398326f99059ff775485246999027b319795580801ba073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }

    {
      const transaction = TransactionEnvelope.fromLegacy({
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
      expect(TransactionEnvelope.serialize(transaction)).toMatchInlineSnapshot(
        '"0xf8637584b2d05e0082c9ab9455d398326f99059ff775485246999027b319795580801ca073b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bfa0354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23"',
      )
    }
  })

  test('behavior: zeroish sig coords', () => {
    const serialized = TransactionEnvelope.serialize({
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
      TransactionEnvelope.serialize({
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
      `
      [InvalidSignatureVError: Value \`29\` is an invalid v value. v must be 27, 28 or >=35.

      See: https://oxlib.sh/errors#invalidsignatureverror]
    `,
    )
  })
})

describe('eip2930', () => {
  const transaction = TransactionEnvelope.fromEip2930({
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
    const serialized = TransactionEnvelope.serialize(transaction)
    assertType<TransactionEnvelope.SerializedEip2930>(serialized)
    expect(serialized).toEqual(
      '0x01f863018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('default (all zeros)', () => {
    const transaction = TransactionEnvelope.fromEip2930({
      to: accounts[1].address,
      nonce: 0n,
      chainId: 1,
      value: 0n,
      gasPrice: 0n,
      accessList: [],
    })

    const serialized = TransactionEnvelope.serialize(transaction)

    expect(serialized).toEqual(
      '0x01dc018080809470997970c51812dc3a010c7d01b50e0d17dc79c88080c0',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      chainId: 1,
      to: accounts[1].address,
      type: 'eip2930',
    })
  })

  test('minimal', () => {
    const transaction = TransactionEnvelope.fromEip2930({
      chainId: 1,
    })
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(serialized).toEqual('0x01c801808080808080c0')
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      chainId: 1,
      type: 'eip2930',
    })
  })

  test('minimal (w/ accessList & gasPrice)', () => {
    const transaction = TransactionEnvelope.fromEip2930({
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
    })
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(serialized).toEqual(
      '0x01f8450180847735940080808080f838f7940000000000000000000000000000000000000000e1a00000000000000000000000000000000000000000000000000000000000000001',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelope.fromEip2930({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0x01f8650182031184773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('data', () => {
    const transaction_data = TransactionEnvelope.fromEip2930({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelope.serialize(transaction_data)
    expect(serialized).toEqual(
      '0x01f865018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.hash(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, {
      signature,
    })
    expect(serialized).toEqual(
      '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe01a0dc7b3483c0b183823f07d77247c60678d861080acdc4fb8b9fd131770b475c40a040f16567391132746735aff4d5a3fa5ae42ff3d5d538e341870e0259dc40741a',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  test('options: signature', () => {
    expect(
      TransactionEnvelope.serialize(transaction, {
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
      '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe01a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(
      TransactionEnvelope.serialize(transaction, {
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
      '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe80a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
  })
})

describe('eip1559', () => {
  const transaction = TransactionEnvelope.fromEip1559({
    chainId: 1,
    nonce: 785n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
    maxFeePerGas: Value.fromGwei('2'),
    maxPriorityFeePerGas: Value.fromGwei('2'),
  })

  test('default', () => {
    const serialized = TransactionEnvelope.serialize(transaction)
    assertType<TransactionEnvelope.SerializedEip1559>(serialized)
    expect(serialized).toEqual(
      '0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('default (all zeros)', () => {
    const transaction = TransactionEnvelope.fromEip1559({
      to: accounts[1].address,
      nonce: 0n,
      chainId: 1,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      value: 0n,
    })

    const serialized = TransactionEnvelope.serialize(transaction)

    expect(serialized).toEqual(
      '0x02dd01808080809470997970c51812dc3a010c7d01b50e0d17dc79c88080c0',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      chainId: 1,
      to: accounts[1].address,
      type: 'eip1559',
    })
  })

  test('minimal (w/ type)', () => {
    const transaction = TransactionEnvelope.fromEip1559({
      chainId: 1,
    })
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(serialized).toEqual('0x02c90180808080808080c0')
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('minimal (w/ maxFeePerGas)', () => {
    const transaction = TransactionEnvelope.fromEip1559({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(serialized).toEqual('0x02c90180800180808080c0')
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelope.fromEip1559({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    expect(serialized).toEqual(
      '0x02f101820311847735940084773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('accessList', () => {
    const transaction_accessList = TransactionEnvelope.fromEip1559({
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
    const serialized = TransactionEnvelope.serialize(transaction_accessList)
    expect(serialized).toEqual(
      '0x02f88b0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f85bf859940000000000000000000000000000000000000000f842a00000000000000000000000000000000000000000000000000000000000000001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_accessList,
    )
  })

  test('data', () => {
    const transaction_data = {
      ...transaction,
      data: '0x1234',
    } satisfies TransactionEnvelope.Eip1559
    const serialized = TransactionEnvelope.serialize(transaction_data)
    expect(serialized).toEqual(
      '0x02f10182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234c0',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.hash(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, { signature })
    expect(serialized).toEqual(
      '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c001a0ce18214ff9d06ecaacb61811f9d6dc2be922e8cebddeaf6df0b30d5c498f6d33a05f0487c6dbbf2139f7c705d8054dbb16ecac8ae6256ce2c4c6f2e7ef35b3a496',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  test('options: signature', () => {
    expect(
      TransactionEnvelope.serialize(
        transaction,

        {
          signature: {
            r: BigInt(
              '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
            ),
            s: BigInt(
              '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
            ),
            yParity: 1,
          },
        },
      ),
    ).toEqual(
      '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )

    expect(
      TransactionEnvelope.serialize(
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
      '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )

    expect(
      TransactionEnvelope.serialize(
        transaction,

        {
          signature: {
            r: 0n,
            s: 0n,
            yParity: 0,
          },
        },
      ),
    ).toEqual(
      '0x02f20182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0808080',
    )
  })
})

describe('eip4844', () => {
  const blobs = Blobs.from(Hex.from('abcd'))
  const sidecars = Blobs.toSidecars(blobs, { kzg })
  const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
  const transaction = TransactionEnvelope.fromEip4844({
    chainId: 1,
    nonce: 785n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
    blobVersionedHashes,
  })

  test('default', () => {
    const serialized = TransactionEnvelope.serialize(transaction)
    assertType<TransactionEnvelope.SerializedEip4844>(serialized)
    expect(serialized).toEqual(
      '0x03f84a018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261',
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TransactionEnvelope.fromEip4844({
      blobVersionedHashes,
      chainId: 1,
    })
    const serialized = TransactionEnvelope.serializeEip4844(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x03ec0180808080808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('fees', () => {
    const transaction = TransactionEnvelope.fromEip4844({
      chainId: 1,
      blobVersionedHashes,
      maxFeePerBlobGas: Value.fromGwei('20'),
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('1'),
    })
    const serialized = TransactionEnvelope.serializeEip4844(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x03f83a0180843b9aca008504a817c80080808080c08504a817c800e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('fees', () => {
    const transaction = TransactionEnvelope.fromEip4844({
      chainId: 1,
      blobVersionedHashes,
      gas: 69420n,
    })
    const serialized = TransactionEnvelope.serializeEip4844(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x03ef0180808083010f2c808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
    )
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('no blobVersionedHashes', () => {
    // @ts-expect-error
    const transaction = TransactionEnvelope.fromEip4844({
      chainId: 1,
    })
    const serialized = TransactionEnvelope.serializeEip4844(transaction)
    expect(serialized).toMatchInlineSnapshot(`"0x03cb0180808080808080c080c0"`)
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.hash(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, {
      signature,
    })
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  test('options: signature', () => {
    expect(
      TransactionEnvelope.serialize(transaction, {
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
      TransactionEnvelope.serialize(
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
    const serialized = TransactionEnvelope.serialize(transaction, { sidecars })
    assertType<TransactionEnvelope.SerializedEip4844>(serialized)
    expect(serialized).toMatchSnapshot()
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      sidecars,
    })
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.hash(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, {
      signature,
      sidecars,
    })
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
      sidecars,
    })
  })
})

test('error: unimplemented type', () => {
  expect(() =>
    // @ts-expect-error
    TransactionEnvelope.serialize({ type: '0x05' }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionTypeNotImplementedError: The provided transaction type `0x05` is not implemented.]',
  )
})
