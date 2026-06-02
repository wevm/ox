import type * as core_AccountProof from '../../core/AccountProof.js'
import type * as core_AccessList from '../../core/AccessList.js'
import type * as core_Authorization from '../../core/Authorization.js'
import type * as core_Block from '../../core/Block.js'
import type * as core_BlockOverrides from '../../core/BlockOverrides.js'
import type * as core_Filter from '../../core/Filter.js'
import type * as core_Hex from '../../core/Hex.js'
import type * as core_Log from '../../core/Log.js'
import type * as core_RpcResponse from '../../core/RpcResponse.js'
import type * as core_StateOverrides from '../../core/StateOverrides.js'
import type * as core_Transaction from '../../core/Transaction.js'
import type * as core_TransactionEnvelope from '../../core/TxEnvelope.js'
import type * as core_TransactionReceipt from '../../core/TransactionReceipt.js'
import type * as core_TransactionRequest from '../../core/TransactionRequest.js'
import type * as core_TxEnvelopeEip1559 from '../../core/TxEnvelopeEip1559.js'
import { z } from 'ox/zod'
import type * as zod from 'zod/mini'
import { expectTypeOf, test } from 'vp/test'

test('z entrypoint exposes module and direct integer schema types', () => {
  expectTypeOf<
    zod.output<typeof z.AccountProof.AccountProof>
  >().toEqualTypeOf<core_AccountProof.AccountProof>()
  expectTypeOf<zod.output<typeof z.Hex.Hex>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<zod.input<typeof z.Hex.Hex32>>().toEqualTypeOf<core_Hex.Hex>()
  expectTypeOf<zod.output<typeof z.BigInt>>().toEqualTypeOf<bigint>()
  expectTypeOf<zod.output<typeof z.Number>>().toEqualTypeOf<number>()
  expectTypeOf<zod.output<typeof z.Uint256>>().toEqualTypeOf<bigint>()
  expectTypeOf<zod.output<typeof z.Int8>>().toEqualTypeOf<number>()
  expectTypeOf<
    zod.output<typeof z.Authorization.Signed>
  >().toEqualTypeOf<core_Authorization.Signed>()
  expectTypeOf<
    zod.output<typeof z.BlockOverrides.BlockOverrides>
  >().toEqualTypeOf<core_BlockOverrides.BlockOverrides>()
  expectTypeOf<
    zod.output<typeof z.StateOverrides.StateOverrides>
  >().toEqualTypeOf<core_StateOverrides.StateOverrides>()
  expectTypeOf<zod.output<typeof z.Log.Log>>().toEqualTypeOf<core_Log.Log>()
  expectTypeOf<
    zod.output<typeof z.RpcResponse.RpcResponse>
  >().toEqualTypeOf<core_RpcResponse.RpcResponse>()
  expectTypeOf<
    zod.output<typeof z.AccessList.Item>
  >().toEqualTypeOf<core_AccessList.Item>()
  expectTypeOf<
    zod.output<typeof z.TransactionRequest.TransactionRequest>
  >().toEqualTypeOf<core_TransactionRequest.TransactionRequest>()
  expectTypeOf<
    zod.output<typeof z.TransactionReceipt.TransactionReceipt>
  >().toMatchTypeOf<core_TransactionReceipt.TransactionReceipt>()
  expectTypeOf<
    zod.output<typeof z.Filter.Filter>
  >().toMatchTypeOf<core_Filter.Filter>()
  expectTypeOf<
    zod.output<typeof z.Transaction.Transaction>
  >().toMatchTypeOf<core_Transaction.Transaction>()
  expectTypeOf<
    zod.output<typeof z.Block.Block>
  >().toMatchTypeOf<core_Block.Block>()
  expectTypeOf<core_TxEnvelopeEip1559.TxEnvelopeEip1559>().toMatchTypeOf<
    zod.output<typeof z.TxEnvelopeEip1559.TxEnvelopeEip1559>
  >()
  expectTypeOf<
    zod.output<typeof z.TransactionEnvelope.TransactionEnvelope>
  >().toMatchTypeOf<core_TransactionEnvelope.TxEnvelope>()
})
