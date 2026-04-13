import { Block, Transaction, TransactionRequest } from 'ox'
import type { TransactionEIP1559 as ViemTransactionEIP1559 } from 'viem'
import { expectTypeOf, test } from 'vitest'

test('Viem type: viem TransactionEIP1559 assignable to ox Transaction.Viem', () => {
  const viemTx = {} as ViemTransactionEIP1559<bigint, number, false>
  expectTypeOf(viemTx).toExtend<Transaction.Viem>()
})

test('toViem: result has viem-compatible field types', () => {
  const oxTx = {} as Transaction.Transaction
  const result = Transaction.toViem(oxTx)
  expectTypeOf(result).toExtend<Transaction.Viem>()
  expectTypeOf(result.nonce).toEqualTypeOf<number>()
  expectTypeOf(result.r).toEqualTypeOf<`0x${string}`>()
  expectTypeOf(result.s).toEqualTypeOf<`0x${string}`>()
  expectTypeOf(result.v).toEqualTypeOf<bigint>()
  expectTypeOf(result.typeHex).toEqualTypeOf<`0x${string}` | null>()
  expectTypeOf(result.yParity).toEqualTypeOf<number | undefined>()
})

test('fromViem: accepts Viem shape, returns ox Transaction', () => {
  const viemTx = {} as Transaction.Viem
  const result = Transaction.fromViem(viemTx)
  expectTypeOf(result).toExtend<Transaction.Transaction>()
  expectTypeOf(result.nonce).toEqualTypeOf<bigint>()
  expectTypeOf(result.r).toEqualTypeOf<bigint>()
  expectTypeOf(result.s).toEqualTypeOf<bigint>()
})

test('fromViem: accepts a real viem EIP1559 transaction', () => {
  const viemTx = {} as ViemTransactionEIP1559<bigint, number, false>
  const result = Transaction.fromViem(viemTx)
  expectTypeOf(result).toExtend<Transaction.Transaction>()
})

// — TransactionRequest —

test('TransactionRequest.Viem type: viem-shaped request assignable', () => {
  const viemReq = {} as {
    data?: `0x${string}` | undefined
    from?: `0x${string}` | undefined
    gas?: bigint | undefined
    nonce?: number | undefined
    to?: `0x${string}` | null | undefined
    value?: bigint | undefined
    maxFeePerGas?: bigint | undefined
    maxPriorityFeePerGas?: bigint | undefined
  }
  expectTypeOf(viemReq).toExtend<TransactionRequest.Viem>()
})

test('TransactionRequest.toViem: returns correct types', () => {
  const oxReq = {} as TransactionRequest.TransactionRequest
  const result = TransactionRequest.toViem(oxReq)
  expectTypeOf(result).toExtend<TransactionRequest.Viem>()
  expectTypeOf(result.nonce).toEqualTypeOf<number | undefined>()
})

test('TransactionRequest.fromViem: returns ox TransactionRequest', () => {
  const viemReq = {} as TransactionRequest.Viem
  const result = TransactionRequest.fromViem(viemReq)
  expectTypeOf(result).toExtend<TransactionRequest.TransactionRequest>()
  expectTypeOf(result.nonce).toEqualTypeOf<bigint | undefined>()
})

// — Block —

test('Block.toViem: returns correct field types', () => {
  const oxBlock = {} as Block.Block
  const result = Block.toViem(oxBlock)
  expectTypeOf(result).toExtend<Block.Viem>()
  expectTypeOf(result.baseFeePerGas).toEqualTypeOf<bigint | null>()
  expectTypeOf(result.totalDifficulty).toEqualTypeOf<bigint | null>()
  expectTypeOf(result.blobGasUsed).toEqualTypeOf<bigint>()
  expectTypeOf(result.difficulty).toEqualTypeOf<bigint>()
  expectTypeOf(result.sealFields).toEqualTypeOf<`0x${string}`[]>()
  expectTypeOf(result.uncles).toEqualTypeOf<`0x${string}`[]>()
})

test('Block.fromViem: returns ox Block', () => {
  const viemBlock = {} as Block.Viem
  const result = Block.fromViem(viemBlock)
  expectTypeOf(result).toExtend<Block.Block>()
  expectTypeOf(result.baseFeePerGas).toEqualTypeOf<bigint | undefined>()
})
