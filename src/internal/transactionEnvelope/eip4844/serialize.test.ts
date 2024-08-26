import {
  Blobs,
  Hex,
  Secp256k1,
  TransactionEnvelope,
  TransactionEnvelopeEip4844,
  Value,
} from 'ox'
import { assertType, expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'
import { kzg } from '../../../../test/kzg.js'

const blobs = Blobs.from(Hex.from('abcd'))
const sidecars = Blobs.toSidecars(blobs, { kzg })
const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
const transaction = TransactionEnvelopeEip4844.from({
  chainId: 1,
  nonce: 785n,
  to: accounts[1].address,
  value: Value.fromEther('1'),
  blobVersionedHashes,
})

test('default', () => {
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  assertType<TransactionEnvelopeEip4844.Serialized>(serialized)
  expect(serialized).toEqual(
    '0x03f84a018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261',
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('minimal', () => {
  const transaction = TransactionEnvelopeEip4844.from({
    blobVersionedHashes,
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(
    `"0x03ec0180808080808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('fees', () => {
  const transaction = TransactionEnvelopeEip4844.from({
    chainId: 1,
    blobVersionedHashes,
    maxFeePerBlobGas: Value.fromGwei('20'),
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('1'),
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(
    `"0x03f83a0180843b9aca008504a817c80080808080c08504a817c800e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('fees', () => {
  const transaction = TransactionEnvelopeEip4844.from({
    chainId: 1,
    blobVersionedHashes,
    gas: 69420n,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(
    `"0x03ef0180808083010f2c808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('no blobVersionedHashes', () => {
  // @ts-expect-error
  const transaction = TransactionEnvelopeEip4844.from({
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(`"0x03cb0180808080808080c080c0"`)
})

test('options: signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction, {
    signature,
  })
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

test('options: signature', () => {
  expect(
    TransactionEnvelopeEip4844.serialize(transaction, {
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
    TransactionEnvelopeEip4844.serialize(
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
  const serialized = TransactionEnvelopeEip4844.serialize(transaction, {
    sidecars,
  })
  assertType<TransactionEnvelopeEip4844.Serialized>(serialized)
  expect(serialized).toMatchSnapshot()
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual({
    ...transaction,
    sidecars,
  })
})

test('options: signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction, {
    signature,
    sidecars,
  })
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
    sidecars,
  })
})
