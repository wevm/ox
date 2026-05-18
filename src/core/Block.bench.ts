import { bench, describe } from 'vitest'
import * as Block from './Block.js'
import type * as Hex from './Hex.js'
import type * as Transaction from './Transaction.js'

const txHash =
  '0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93' as Hex.Hex

const baseTransaction: Transaction.Rpc = {
  type: '0x2',
  blockHash:
    '0xebc3644804e4040c0a74c5a5bbbc6b46a71a5d4010fe0c92ebb2fdf4a43ea5dd',
  blockNumber: '0xec6fc6',
  chainId: '0x1',
  from: '0x0000000000000000000000000000000000000000',
  gas: '0x5208',
  hash: txHash,
  input: '0x',
  maxFeePerGas: '0x59682f00',
  maxPriorityFeePerGas: '0x59682f00',
  nonce: '0x0',
  r: '0x0',
  s: '0x0',
  to: '0x0000000000000000000000000000000000000000',
  transactionIndex: '0x0',
  v: '0x0',
  yParity: '0x0',
  value: '0x0',
  accessList: [],
}

function makeRpc(txCount: number): Block.Rpc<true> {
  return {
    blobGasUsed: '0x1',
    baseFeePerGas: '0x0',
    difficulty: '0x2d3a678cddba9b',
    excessBlobGas: '0x2',
    extraData: '0x',
    gasLimit: '0x1c9c347',
    gasUsed: '0x0',
    hash: '0xebc3644804e4040c0a74c5a5bbbc6b46a71a5d4010fe0c92ebb2fdf4a43ea5dd',
    logsBloom: ('0x' + '0'.repeat(512)) as Hex.Hex,
    miner: '0x0000000000000000000000000000000000000000',
    mixHash:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    nonce: '0x0000000000000000',
    number: '0xec6fc6',
    parentHash:
      '0xe55516ad8029e53cd32087f14653d851401b05245abb1b2d6ed4ddcc597ac5a6',
    receiptsRoot:
      '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    sealFields: [],
    sha3Uncles:
      '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
    size: '0x208',
    stateRoot:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '0x63198f6f',
    totalDifficulty: '0x1',
    transactions: Array.from(
      { length: txCount },
      () => baseTransaction,
    ) as readonly Transaction.Rpc[],
    transactionsRoot:
      '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    uncles: [],
    withdrawals: [],
    withdrawalsRoot:
      '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
  }
}

const hashesOnly: any = {
  ...makeRpc(0),
  transactions: Array.from({ length: 100 }, () => txHash),
}

const withTxs1: any = makeRpc(1)
const withTxs10: any = makeRpc(10)
const withTxs100: any = makeRpc(100)

const parsedHashes: any = Block.fromRpc(hashesOnly)
const parsedTxs1: any = Block.fromRpc(withTxs1)
const parsedTxs10: any = Block.fromRpc(withTxs10)
const parsedTxs100: any = Block.fromRpc(withTxs100)

describe('Block.fromRpc', () => {
  bench('hashes only (100)', () => {
    Block.fromRpc(hashesOnly)
  })
  bench('with 1 transaction', () => {
    Block.fromRpc(withTxs1)
  })
  bench('with 10 transactions', () => {
    Block.fromRpc(withTxs10)
  })
  bench('with 100 transactions', () => {
    Block.fromRpc(withTxs100)
  })
})

describe('Block.toRpc', () => {
  bench('hashes only (100)', () => {
    Block.toRpc(parsedHashes)
  })
  bench('with 1 transaction', () => {
    Block.toRpc(parsedTxs1)
  })
  bench('with 10 transactions', () => {
    Block.toRpc(parsedTxs10)
  })
  bench('with 100 transactions', () => {
    Block.toRpc(parsedTxs100)
  })
})
