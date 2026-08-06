import {
  Bal,
  BlockState,
  Database,
  Ethereum,
  Evm,
  ExecutedTx,
  Inspector,
  PendingState,
  SpecId,
  StateChange,
  TxResult,
} from 'ox/evm'
import { describe, expectTypeOf, test } from 'vp/test'

describe('create', () => {
  test('every option is optional', async () => {
    expectTypeOf(await Evm.create()).toEqualTypeOf<Evm.Evm<false>>()
    expectTypeOf(
      await Evm.create({ database: Database.fromMemory() }),
    ).toEqualTypeOf<Evm.Evm<false>>()
  })

  test('specId narrows to the specification union', () => {
    expectTypeOf<Evm.create.Options['specId']>().toEqualTypeOf<
      SpecId.SpecId | undefined
    >()
    void Evm.create({
      // @ts-expect-error a specification that does not exist
      specId: 'verkle',
    })
  })

  test('chainId is a bigint, not a number', () => {
    void Evm.create({
      // @ts-expect-error chain ids are bigints, never numbers
      chainId: 1,
    })
  })

  test('an asynchronous database makes every read asynchronous', async () => {
    const fork = await Evm.create({
      database: Database.fromAsync({
        getAccount: async () => undefined,
        getBlockHash: async () => `0x${'00'.repeat(32)}`,
        getCodeByHash: async () => new Uint8Array(),
        getStorage: async () => 0n,
      }),
    })

    expectTypeOf(fork).toEqualTypeOf<Evm.Evm<true>>()

    // One name, and the type says whether to await it.
    expectTypeOf(Evm.callTx(fork, {} as never)).toEqualTypeOf<
      Promise<TxResult.TxResult>
    >()
    expectTypeOf(Evm.readAccountInfo(fork, '0x')).toEqualTypeOf<
      Promise<Database.Account | undefined>
    >()

    const evm = await Evm.create()
    expectTypeOf(
      Evm.callTx(evm, {} as never),
    ).toEqualTypeOf<TxResult.TxResult>()
    expectTypeOf(Evm.readAccountInfo(evm, '0x')).toEqualTypeOf<
      Database.Account | undefined
    >()
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

describe('ExecutedTx', () => {
  test('transact returns a disposable handle', () => {
    expectTypeOf(
      Evm.transact({} as Evm.Evm<false>, {} as never),
    ).toEqualTypeOf<ExecutedTx.ExecutedTx>()
    expectTypeOf(Evm.transact({} as Evm.Evm<true>, {} as never)).toEqualTypeOf<
      Promise<ExecutedTx.ExecutedTx>
    >()
    expectTypeOf<ExecutedTx.ExecutedTx[typeof Symbol.dispose]>().toEqualTypeOf<
      () => void
    >()
  })

  test('every resolution returns the result; detach pairs it with state', () => {
    expectTypeOf<
      ReturnType<typeof ExecutedTx.commit>
    >().toEqualTypeOf<TxResult.TxResult>()
    expectTypeOf<
      ReturnType<typeof ExecutedTx.discard>
    >().toEqualTypeOf<TxResult.TxResult>()
    expectTypeOf<
      ReturnType<typeof ExecutedTx.detach>
    >().toEqualTypeOf<TxResult.WithState>()
    expectTypeOf<
      TxResult.WithState['pendingState']
    >().toEqualTypeOf<PendingState.PendingState>()
  })

  test('sink callbacks receive tag-free records', () => {
    expectTypeOf<
      Parameters<NonNullable<StateChange.Sink['account']>>[0]
    >().toEqualTypeOf<StateChange.Account>()
    // The wire's routing tag never reaches a sink.
    expectTypeOf<StateChange.Account>().not.toHaveProperty('kind')
  })

  test('a fields transaction rejects a stray serialized property', () => {
    expectTypeOf<{
      from: `0x${string}`
      gas: bigint
      serialized: `0x${string}`
      to: `0x${string}`
    }>().not.toExtend<Ethereum.Tx.Fields>()
  })

  test('handler kinds are named literals', () => {
    expectTypeOf<(typeof Evm.handlerKinds)['invalidNonce']>().toEqualTypeOf<5>()
    expectTypeOf<InstanceType<typeof Evm.HandlerError>['code']>().toEqualTypeOf<
      keyof typeof Evm.handlerKinds | undefined
    >()
  })
})

describe('version', () => {
  test('feature and gas names are the declared unions', () => {
    expectTypeOf<Evm.Feature>().toExtend<string>()
    expectTypeOf<'nonceCheck'>().toExtend<Evm.Feature>()
    expectTypeOf<'logtopic'>().toExtend<Evm.GasId>()
    // @ts-expect-error not a flag evm2 declares
    expectTypeOf<'notAFeature'>().toExtend<Evm.Feature>()
  })

  test('overrides are partial, and scalars are bigints', () => {
    expectTypeOf<Evm.Version>().toExtend<{
      features?: Partial<Record<Evm.Feature, boolean>> | undefined
    }>()
    expectTypeOf<Evm.Version['maxCodeSize']>().toEqualTypeOf<
      bigint | undefined
    >()
    expectTypeOf<NonNullable<Evm.Version['gas']>['logtopic']>().toEqualTypeOf<
      number | undefined
    >()
  })

  test('the setters take an EVM of either kind', () => {
    expectTypeOf(Evm.setBlock).toBeCallableWith({} as Evm.Evm<true>, {})
    expectTypeOf(Evm.setBlock).toBeCallableWith({} as Evm.Evm<false>, {})
    expectTypeOf(Evm.setExecutionConfig).toBeCallableWith(
      {} as Evm.Evm<false>,
      { specId: 'osaka' },
    )
  })
})

describe('inspection', () => {
  test('the inspector takes an EVM of either kind', () => {
    expectTypeOf(Evm.setInspector).toBeCallableWith({} as Evm.Evm<true>, {})
    expectTypeOf(Evm.setInspector).toBeCallableWith({} as Evm.Evm<false>)
    expectTypeOf(Evm.clearInspector).toBeCallableWith({} as Evm.Evm<true>)
  })

  test('a trace is optional on the result, so untraced runs need no guard', () => {
    expectTypeOf<TxResult.TxResult['trace']>().toEqualTypeOf<
      Inspector.Trace | undefined
    >()
    // `tree` and `steps` accept the optional trace directly.
    expectTypeOf(Inspector.tree).toBeCallableWith(undefined)
    expectTypeOf(Inspector.steps).toBeCallableWith(undefined)
  })

  test('events discriminate on kind', () => {
    type Step = Extract<Inspector.Event, { kind: 'step' }>
    expectTypeOf<Step['opcode']>().toEqualTypeOf<number>()
    expectTypeOf<Step['gas']>().toEqualTypeOf<bigint>()
    expectTypeOf(Inspector.steps({} as Inspector.Trace)).toEqualTypeOf<
      readonly Step[]
    >()

    // A frame's children are frames, so the tree recurses.
    expectTypeOf<Inspector.Frame['calls']>().toEqualTypeOf<
      readonly Inspector.Frame[]
    >()
    // @ts-expect-error a step carries no output
    expectTypeOf<Step['output']>()
  })
})

describe('block access lists', () => {
  test('an uncovered read is in the error union of the reads that raise it', () => {
    // Attaching a list cannot refuse a read; executing against one can.
    expectTypeOf<Evm.NotCoveredError>().toExtend<Evm.callTx.ErrorType>()
    expectTypeOf<Evm.NotCoveredError>().toExtend<Evm.transact.ErrorType>()
    expectTypeOf<Evm.NotCoveredError>().toExtend<Evm.readAccountInfo.ErrorType>()
    // @ts-expect-error installing a list performs no read
    expectTypeOf<Evm.NotCoveredError>().toExtend<Evm.setBal.ErrorType>()
  })
})

describe('asynchronous inference', () => {
  test('every setter is awaitable on an asynchronous EVM', async () => {
    const memory = Database.fromMemory({})
    const evm = await Evm.create({
      database: Database.fromAsync({
        getAccount: async (address) => memory.getAccount(address),
        getBlockHash: async (number) => memory.getBlockHash(number),
        getCodeByHash: async (codeHash) => memory.getCodeByHash(codeHash),
        getStorage: async (address, key) => memory.getStorage(address, key),
      }),
    })

    expectTypeOf(evm).toEqualTypeOf<Evm.Evm<true>>()
    expectTypeOf(Evm.setBlock(evm, {})).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.setInspector(evm, {})).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.clearInspector(evm)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.setExecutionConfig(evm, {})).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.setBal(evm, { accounts: [] })).toEqualTypeOf<
      Promise<void>
    >()
    expectTypeOf(Evm.clearBal(evm)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.enableBalBuilder(evm)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.clearBalBuilder(evm)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.setBalIndex(evm, 1n)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.takeBal(evm)).toEqualTypeOf<Promise<Bal.Bal | undefined>>()
  })
})

describe('block execution', () => {
  test('every block setter is awaitable on an asynchronous EVM', async () => {
    const memory = Database.fromMemory({})
    const evm = await Evm.create({
      database: Database.fromAsync({
        getAccount: async (address) => memory.getAccount(address),
        getBlockHash: async (number) => memory.getBlockHash(number),
        getCodeByHash: async (codeHash) => memory.getCodeByHash(codeHash),
        getStorage: async (address, key) => memory.getStorage(address, key),
      }),
    })

    expectTypeOf(Evm.startBlockState(evm)).toEqualTypeOf<
      Promise<BlockState.Token>
    >()
    expectTypeOf(Evm.warmPrecompiles(evm)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(Evm.takeBlockState(evm, 1n)).toEqualTypeOf<
      Promise<BlockState.BlockState>
    >()
    expectTypeOf(Evm.systemCall(evm, { address: '0x' })).toEqualTypeOf<
      Promise<ExecutedTx.ExecutedTx>
    >()
  })

  test('a system call resolves like a transaction', () => {
    // Same handle type, so every resolution applies to it.
    expectTypeOf(
      Evm.systemCall({} as Evm.Evm<false>, { address: '0x' }),
    ).toEqualTypeOf<ExecutedTx.ExecutedTx>()
    expectTypeOf(ExecutedTx.commitTo).toBeCallableWith(
      {} as ExecutedTx.ExecutedTx,
      1n,
    )
  })
})

describe('error unions', () => {
  /** The union's member with `name`, or `never` when it has none. */
  type Named<union, name> = Extract<union, { name: name }>

  test('every operation reaching the engine can report a busy one', () => {
    // Each goes through the engine, which raises `ReentrancyError` when an
    // operation is already running, so each union has to carry it. Matched by
    // name: these error types are otherwise structurally alike, so assignability
    // alone would pass whatever the union listed.
    expectTypeOf<
      Named<Evm.setBlock.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.setInspector.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.setBal.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.takeBal.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.startBlockState.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.takeBlockState.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.warmPrecompiles.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.commitSource.ErrorType, 'Evm.ReentrancyError'>
    >().not.toBeNever()
  })

  test('an operation reports the failures its own payload can cause', () => {
    // Encoding a payload can overflow a field; decoding can meet a shape this
    // ABI version cannot read.
    expectTypeOf<
      Named<Evm.commitSource.ErrorType, 'Evm.EncodeError'>
    >().not.toBeNever()
    expectTypeOf<
      Named<Evm.takeBal.ErrorType, 'Evm.DecodeError'>
    >().not.toBeNever()

    // `warmPrecompiles` carries no payload, so it cannot fail encoding one.
    expectTypeOf<
      Named<Evm.warmPrecompiles.ErrorType, 'Evm.EncodeError'>
    >().toBeNever()
  })
})
