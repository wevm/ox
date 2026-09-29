import type { RpcSchema } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

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

  type BlockNumber = Extract<Result, { Request: { method: 'eth_blockNumber' } }>
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

test('frame fill responses do not require raw bytes or lookup metadata', () => {
  type Filled = Extract<
    RpcSchema.Eth,
    { Request: { method: 'eth_fillTransaction' } }
  >['ReturnType']
  const filled = {
    tx: {
      type: '0x6',
      chainId: '0x1',
      nonce: '0x0',
      from: '0x1111111111111111111111111111111111111111',
      frames: [
        {
          mode: '0x2',
          flags: '0x0',
          executionGas: '0x10000',
          stateGas: '0x0',
          value: '0x0',
          data: '0x',
        },
      ],
      signatures: [{ scheme: '0x1' }],
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x1',
      maxFeePerBlobGas: '0x0',
      blobVersionedHashes: [],
    },
  } as const satisfies Filled
  expectTypeOf(filled).toExtend<Filled>()
})

test('frame simulation results expose payer and frame results', () => {
  type Result = Extract<
    RpcSchema.Eth,
    { Request: { method: 'eth_simulateV1' } }
  >['ReturnType'][number]
  type Call = NonNullable<Result['calls']>[number]
  expectTypeOf<Call['payer']>().toEqualTypeOf<`0x${string}` | undefined>()
  type Frame = NonNullable<Call['frameResults']>[number]
  expectTypeOf<Frame['status']>().toEqualTypeOf<'0x0' | '0x1' | '0x2'>()
  expectTypeOf<Frame['executionGasUsed']>().toEqualTypeOf<`0x${string}`>()
  expectTypeOf<Frame['stateGasUsed']>().toEqualTypeOf<`0x${string}`>()
  expectTypeOf<Frame['returnData']>().toEqualTypeOf<`0x${string}`>()
})

describe('Eth', () => {
  test('eth_getTransactionCount', () => {
    type Request = RpcSchema.ExtractRequest<
      RpcSchema.Eth,
      'eth_getTransactionCount'
    >
    type Params = Request['params']

    expectTypeOf<['0x1234', 'latest']>().toMatchTypeOf<Params>()
    expectTypeOf<
      ['0x1234', 'pending', readonly ['0x0']]
    >().toMatchTypeOf<Params>()
    expectTypeOf<
      ['0x1234', '0x10', readonly ['0x1', '0x2']]
    >().toMatchTypeOf<Params>()
    expectTypeOf<['0x1234', 'latest', undefined]>().toMatchTypeOf<Params>()
    expectTypeOf<['0x1234', 'latest', '0x1']>().not.toMatchTypeOf<Params>()
    expectTypeOf<
      ['0x1234', 'latest', readonly [1n]]
    >().not.toMatchTypeOf<Params>()
    expectTypeOf<['0x1234', readonly ['0x1']]>().not.toMatchTypeOf<Params>()
    expectTypeOf<
      ['0x1234', 'latest', readonly ['0x1'], '0x2']
    >().not.toMatchTypeOf<Params>()
    expectTypeOf<
      RpcSchema.ExtractReturnType<RpcSchema.Eth, 'eth_getTransactionCount'>
    >().toEqualTypeOf<`0x${string}`>()
  })
})
