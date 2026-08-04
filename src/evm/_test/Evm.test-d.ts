import { Database, Evm, SpecId, TxResult } from 'ox/evm'
import { describe, expectTypeOf, test } from 'vp/test'

describe('create', () => {
  test('every option is optional', () => {
    expectTypeOf(Evm.create).toBeCallableWith()
    expectTypeOf(Evm.create).toBeCallableWith({
      database: Database.fromMemory(),
    })
  })

  test('specId narrows to the specification union', () => {
    expectTypeOf<Evm.create.Options['specId']>().toEqualTypeOf<
      SpecId.SpecId | undefined
    >()
    expectTypeOf(Evm.create).toBeCallableWith({
      // @ts-expect-error a specification that does not exist
      specId: 'verkle',
    })
  })

  test('chainId is a bigint, not a number', () => {
    expectTypeOf(Evm.create).toBeCallableWith({
      // @ts-expect-error chain ids are bigints, never numbers
      chainId: 1,
    })
  })

  test('returns an EVM, not a promise of unknown', async () => {
    expectTypeOf(Evm.create).returns.resolves.toEqualTypeOf<Evm.Evm>()
  })
})

describe('callTx', () => {
  test('stop is the named union rather than a string or number', () => {
    expectTypeOf<TxResult.TxResult['stop']>().toEqualTypeOf<TxResult.Stop>()
    expectTypeOf<TxResult.Stop>().toExtend<string>()
    expectTypeOf<'return'>().toExtend<TxResult.Stop>()
    expectTypeOf<'nope'>().not.toExtend<TxResult.Stop>()
  })

  test('gas is bigint throughout', () => {
    expectTypeOf<TxResult.TxResult['totalGasSpent']>().toEqualTypeOf<bigint>()
    expectTypeOf(TxResult.txGasUsed).returns.toEqualTypeOf<bigint>()
    expectTypeOf(TxResult.regularGasSpent).returns.toEqualTypeOf<bigint>()
    expectTypeOf(TxResult.stateGasSpent).returns.toEqualTypeOf<bigint>()
  })

  test('createdAddress and errorCode are optional, not nullable', () => {
    expectTypeOf<TxResult.TxResult['createdAddress']>().toEqualTypeOf<
      `0x${string}` | undefined
    >()
    expectTypeOf<TxResult.TxResult['errorCode']>().toEqualTypeOf<
      bigint | undefined
    >()
  })
})

describe('Database', () => {
  test('a source is satisfied by a plain object', () => {
    expectTypeOf<{
      getAccount: (address: `0x${string}`) => Database.Account | undefined
      getBlockHash: (number: bigint) => `0x${string}`
      getCodeByHash: (codeHash: `0x${string}`) => Uint8Array
      getStorage: (address: `0x${string}`, key: bigint) => bigint
    }>().toExtend<Database.Database>()
  })

  test('inline code is optional on an account', () => {
    expectTypeOf<Database.Account['code']>().toEqualTypeOf<
      Uint8Array | undefined
    >()
  })
})

describe('SpecId', () => {
  test('latest is a specific specification, not the whole union', () => {
    expectTypeOf<typeof SpecId.latest>().toEqualTypeOf<'osaka'>()
    expectTypeOf(SpecId.enables).toBeCallableWith('osaka', 'cancun')
  })
})
