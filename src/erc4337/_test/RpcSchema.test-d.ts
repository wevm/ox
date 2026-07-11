import { type Address, type Hex, RpcSchema as CoreRpcSchema } from 'ox'
import {
  RpcSchema,
  UserOperation,
  UserOperationGas,
  UserOperationReceipt,
} from 'ox/erc4337'
import { expectTypeOf, test } from 'vp/test'

test('Bundler: EntryPoint 0.9 methods', () => {
  type Schema = RpcSchema.Bundler<'0.9'>

  type Estimate = CoreRpcSchema.ExtractReturnType<
    Schema,
    'eth_estimateUserOperationGas'
  >
  expectTypeOf<Estimate>().toEqualTypeOf<UserOperationGas.Rpc<'0.9'>>()

  type Receipt = CoreRpcSchema.ExtractReturnType<
    Schema,
    'eth_getUserOperationReceipt'
  >
  expectTypeOf<Receipt>().toEqualTypeOf<UserOperationReceipt.Rpc<'0.9'> | null>()

  type Send = CoreRpcSchema.ExtractParams<Schema, 'eth_sendUserOperation'>
  expectTypeOf<Send>().toEqualTypeOf<
    [userOperation: UserOperation.Rpc<'0.9'>, entrypoint: Address.Address]
  >()
})

test('Bundler: eth_getUserOperationByHash result', () => {
  type Result = CoreRpcSchema.ExtractReturnType<
    RpcSchema.Bundler<'0.9'>,
    'eth_getUserOperationByHash'
  >
  type Info = Exclude<Result, null>

  expectTypeOf<Result>().toEqualTypeOf<UserOperation.RpcTransactionInfo<'0.9'> | null>()
  expectTypeOf<Info['blockHash']>().toEqualTypeOf<Hex.Hex | null>()
  expectTypeOf<Info['blockNumber']>().toEqualTypeOf<Hex.Hex | null>()
  expectTypeOf<Info['transactionHash']>().toEqualTypeOf<Hex.Hex | null>()
  expectTypeOf<Info['userOperation']>().toEqualTypeOf<
    UserOperation.Rpc<'0.9'>
  >()
})

test('BundlerDebug: EntryPoint 0.9 mempool', () => {
  type Result = CoreRpcSchema.ExtractReturnType<
    RpcSchema.BundlerDebug<'0.9'>,
    'debug_bundler_dumpMempool'
  >

  expectTypeOf<Result>().toEqualTypeOf<
    readonly { userOp: UserOperation.Rpc<'0.9'> }[]
  >()
})
