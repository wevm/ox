// TODO: Add `eth_sendRawTransaction` tests.

import {
  Secp256k1,
  TransactionEnvelope,
  TransactionEnvelopeLegacy,
  Value,
} from 'ox'
import { assertType, expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

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
  expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(transaction)
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
  expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(transaction)
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
    payload: TransactionEnvelope.getSignPayload(transaction),
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
    payload: TransactionEnvelope.getSignPayload(transaction_chainId),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeLegacy.serialize(transaction_chainId, {
    signature,
  })
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
    `
      [InvalidSignatureVError: Value \`29\` is an invalid v value. v must be 27, 28 or >=35.

      See: https://oxlib.sh/errors#invalidsignatureverror]
    `,
  )
})
