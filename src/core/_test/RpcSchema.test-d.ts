import { RpcSchema } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('ToViem: converts ox schema to viem schema', () => {
  type OxSchema =
    | {
        Request: { method: 'eth_blockNumber'; params?: undefined }
        ReturnType: `0x${string}`
      }
    | {
        Request: { method: 'eth_chainId'; params?: undefined }
        ReturnType: `0x${string}`
      }

  type Result = RpcSchema.ToViem<OxSchema>

  expectTypeOf<Result>().toMatchTypeOf<
    readonly {
      Method: string
      Parameters?: unknown
      ReturnType: unknown
    }[]
  >()

  type Item = Result[number]
  expectTypeOf<Item['Method']>().toEqualTypeOf<
    'eth_blockNumber' | 'eth_chainId'
  >()
})

test('ToViem: preserves params', () => {
  type OxSchema = {
    Request: {
      method: 'eth_getBalance'
      params: [address: `0x${string}`, block: string]
    }
    ReturnType: `0x${string}`
  }

  type Result = RpcSchema.ToViem<OxSchema>

  expectTypeOf<Result[0]['Method']>().toEqualTypeOf<'eth_getBalance'>()
  expectTypeOf<Result[0]['Parameters']>().toEqualTypeOf<
    [address: `0x${string}`, block: string]
  >()
  expectTypeOf<Result[0]['ReturnType']>().toEqualTypeOf<`0x${string}`>()
})

test('FromViem: converts viem schema to ox schema', () => {
  type ViemSchema = [
    {
      Method: 'eth_blockNumber'
      Parameters?: undefined
      ReturnType: `0x${string}`
    },
    {
      Method: 'eth_chainId'
      Parameters?: undefined
      ReturnType: `0x${string}`
    },
  ]

  type Result = RpcSchema.FromViem<ViemSchema>

  expectTypeOf<Result>().toMatchTypeOf<RpcSchema.Generic>()

  type BlockNumber = Extract<
    Result,
    { Request: { method: 'eth_blockNumber' } }
  >
  expectTypeOf<BlockNumber['ReturnType']>().toEqualTypeOf<`0x${string}`>()
})

test('FromViem: preserves params', () => {
  type ViemSchema = [
    {
      Method: 'eth_getBalance'
      Parameters: [address: `0x${string}`, block: string]
      ReturnType: `0x${string}`
    },
  ]

  type Result = RpcSchema.FromViem<ViemSchema>

  type Item = Extract<Result, { Request: { method: 'eth_getBalance' } }>
  expectTypeOf<Item['Request']['params']>().toEqualTypeOf<
    [address: `0x${string}`, block: string]
  >()
  expectTypeOf<Item['ReturnType']>().toEqualTypeOf<`0x${string}`>()
})

test('roundtrip: ToViem -> FromViem preserves schema', () => {
  type Original = {
    Request: {
      method: 'eth_getBalance'
      params: [address: `0x${string}`, block: string]
    }
    ReturnType: `0x${string}`
  }

  type Roundtrip = RpcSchema.FromViem<RpcSchema.ToViem<Original>>

  type Item = Extract<Roundtrip, { Request: { method: 'eth_getBalance' } }>
  expectTypeOf<Item['Request']['method']>().toEqualTypeOf<'eth_getBalance'>()
  expectTypeOf<Item['ReturnType']>().toEqualTypeOf<`0x${string}`>()
})

test('roundtrip: FromViem -> ToViem preserves schema', () => {
  type Original = [
    {
      Method: 'eth_blockNumber'
      Parameters?: undefined
      ReturnType: `0x${string}`
    },
  ]

  type Roundtrip = RpcSchema.ToViem<RpcSchema.FromViem<Original>>

  expectTypeOf<Roundtrip[0]['Method']>().toEqualTypeOf<'eth_blockNumber'>()
  expectTypeOf<Roundtrip[0]['ReturnType']>().toEqualTypeOf<`0x${string}`>()
})
