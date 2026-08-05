import { Address, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx, Inspector } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Recorded executions.
 *
 * The property that matters most is the one asserted last: recording must not
 * change what executes.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const
const inner = '0x00000000000000000000000000000000000000c1' as const

/**
 * Emits a log, then calls `inner` with no data.
 *
 * PUSH0 PUSH0 PUSH0 LOG1, then PUSH0 x5, PUSH20 inner, GAS, CALL, STOP.
 */
const code = `0x5f5f5fa15f5f5f5f5f73${inner.slice(2)}5af100` as const

/** PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN */
const innerCode = '0x602a5f5260205ff3' as const

function transaction(options: { nonce?: bigint } = {}) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 200_000n,
    gasPrice: 0n,
    nonce: options.nonce ?? 0n,
    to: target,
    value: 0n,
  })
  const signature = Secp256k1.sign({
    payload: TxEnvelopeLegacy.getSignPayload(envelope),
    privateKey,
  })
  return {
    from: sender,
    serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
  }
}

function evm() {
  return Evm.create({
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code },
        [inner]: { code: innerCode },
      },
    }),
  })
}

describe('setInspector', () => {
  test('behavior: an untraced execution reports no trace', async () => {
    expect(Evm.callTx(await evm(), transaction()).trace).toBeUndefined()
  })

  test('behavior: calls and logs are recorded without asking for steps', async () => {
    const instance = await evm()
    Evm.setInspector(instance, {})

    const trace = Evm.callTx(instance, transaction()).trace
    expect(trace?.truncated).toBe(false)

    // Message hooks only, so the stream stays small.
    expect(trace?.events.some((event) => event.kind === 'step')).toBe(false)
    expect(trace?.events.map((event) => event.kind)).toEqual([
      'call',
      'log',
      'call',
      'callEnd',
      'callEnd',
    ])
  })

  test('behavior: steps are recorded only when asked for', async () => {
    const instance = await evm()
    Evm.setInspector(instance, { stack: true, steps: true })

    const trace = Evm.callTx(instance, transaction()).trace
    const steps = Inspector.steps(trace)

    expect(steps.length).toBeGreaterThan(5)
    // The first instruction of the outer frame is PUSH0.
    expect(steps[0]?.opcode).toBe(0x5f)
    expect(steps[0]?.pc).toBe(0)
    // Gas only decreases.
    expect(steps.at(-1)!.gas).toBeLessThan(steps[0]!.gas)
  })

  test('behavior: clearing stops recording', async () => {
    const instance = await evm()
    Evm.setInspector(instance, {})
    expect(Evm.callTx(instance, transaction()).trace).toBeDefined()

    Evm.clearInspector(instance)
    expect(Evm.callTx(instance, transaction()).trace).toBeUndefined()
  })

  test('behavior: the limit truncates without failing the execution', async () => {
    const instance = await evm()
    Evm.setInspector(instance, { limit: 64, stack: true, steps: true })

    const result = Evm.callTx(instance, transaction())

    // Execution succeeded; only the recording stopped short.
    expect(result.status).toBe(true)
    expect(result.trace?.truncated).toBe(true)
  })
})

describe('tree', () => {
  test('behavior: nesting is recovered from the flat stream', async () => {
    const instance = await evm()
    Evm.setInspector(instance, {})

    const [root] = Inspector.tree(Evm.callTx(instance, transaction()).trace)

    expect(root?.destination).toBe(target)
    expect(root?.logs.length).toBe(1)
    expect(root?.calls.length).toBe(1)

    // The inner call is a child, and it returned the word the code writes.
    const child = root?.calls[0]
    expect(child?.destination).toBe(inner)
    expect(child?.output).toBe(Hex.fromNumber(42, { size: 32 }))
    expect(child?.calls.length).toBe(0)
  })

  test('behavior: a create reports the address it deployed', async () => {
    /** Initcode returning `PUSH1 42 PUSH0 MSTORE PUSH1 32 PUSH0 RETURN`. */
    const initcode = '0x67602a5f5260205ff35f5260086018f3' as const
    const envelope = TxEnvelopeLegacy.from({
      chainId: 1,
      data: initcode,
      gas: 200_000n,
      gasPrice: 0n,
      nonce: 0n,
      value: 0n,
    })
    const signature = Secp256k1.sign({
      payload: TxEnvelopeLegacy.getSignPayload(envelope),
      privateKey,
    })

    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: { [sender.toLowerCase()]: { balance: 10n ** 18n } },
      }),
    })
    Evm.setInspector(instance, {})

    const result = Evm.callTx(instance, {
      from: sender,
      serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
    })
    const [root] = Inspector.tree(result.trace)

    expect(root?.kind).toBe('create')
    expect(root?.createdAddress).toBe(result.createdAddress)
  })

  test('behavior: an empty trace yields no frames', () => {
    expect(Inspector.tree(undefined)).toEqual([])
  })
})

describe('transact', () => {
  test('behavior: a transaction reports its own trace', async () => {
    const instance = await evm()
    Evm.setInspector(instance, {})

    // The trace arrives with the execution, not with its resolution: the
    // collector is held outside the engine, so a parked handle does not hide it.
    const executed = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(executed).trace?.events.length).toBeGreaterThan(0)

    ExecutedTx.discard(executed)
  })
})

describe('bounds', () => {
  test('behavior: a truncated trace is a prefix, never a stream with holes', async () => {
    const full = await evm()
    Evm.setInspector(full, { limit: 4_000_000, steps: true })
    const expected = Evm.callTx(full, transaction()).trace!

    // Small enough to stop partway through the steps, and step-end records are
    // smaller than step records, so an unlatched limit would admit them after
    // refusing a step and leave a hole.
    const partial = await evm()
    Evm.setInspector(partial, { limit: 200, steps: true })
    const trace = Evm.callTx(partial, transaction()).trace!

    expect(trace.truncated).toBe(true)
    expect(trace.events.length).toBeGreaterThan(0)
    expect(trace.events.length).toBeLessThan(expected.events.length)
    expect(trace.events).toEqual(expected.events.slice(0, trace.events.length))
  })

  test('behavior: the limit counts what a record actually writes', async () => {
    // A message record encodes 108 bytes before its input: tag, kind, depth, gas
    // limit, three addresses, the value word, and the input length. Under a limit
    // between the header without the value word and the true size, the record has
    // to be refused rather than written past the bound.
    const instance = await evm()
    Evm.setInspector(instance, { limit: 90 })

    const trace = Evm.callTx(instance, transaction()).trace!

    expect(trace.events).toEqual([])
    expect(trace.truncated).toBe(true)
  })

  test('behavior: a deep stack is recorded whole', async () => {
    // 300 words, past what a byte-wide count can express. A wrapped count would
    // leave the words to be read as event tags.
    const deep = `0x${'5f'.repeat(300)}00` as const
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [target]: { code: deep },
        },
      }),
    })
    Evm.setInspector(instance, { limit: 4_000_000, stack: true, steps: true })

    const result = Evm.callTx(instance, transaction())
    const depths = Inspector.steps(result.trace).map(
      (step) => step.stack.length,
    )

    expect(result.status).toBe(true)
    expect(Math.max(...depths)).toBe(300)
    expect(result.trace?.truncated).toBe(false)
  })
})

describe('selfdestruct', () => {
  test('behavior: the destroyed account is reported, not just the beneficiary', async () => {
    /** PUSH20 sender, SELFDESTRUCT */
    const code_ = `0x73${sender.slice(2)}ff` as const
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [target]: { balance: 5n, code: code_ },
        },
      }),
    })
    Evm.setInspector(instance, {})

    const [root] = Inspector.tree(Evm.callTx(instance, transaction()).trace)

    expect(root?.selfdestructs).toEqual([
      { contract: target, target: sender, value: 5n },
    ])
  })
})

describe('asynchronous sources', () => {
  test('behavior: a retried execution traces once, not once per attempt', async () => {
    // Every uncached read abandons the attempt and repeats it, so a collector
    // that is not cleared between attempts accumulates partial executions.
    const sync = await evm()
    Evm.setInspector(sync, { limit: 4_000_000, stack: true, steps: true })
    const expected = Evm.callTx(sync, transaction()).trace

    const memory = Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code },
        [inner]: { code: innerCode },
      },
    })
    const fork = await Evm.create({
      database: Database.fromAsync({
        getAccount: async (address) => memory.getAccount(address),
        getBlockHash: async (number) => memory.getBlockHash(number),
        getCodeByHash: async (codeHash) => memory.getCodeByHash(codeHash),
        getStorage: async (address, key) => memory.getStorage(address, key),
      }),
    })

    // Serialized like the other setters, so this is awaited rather than assumed.
    await Evm.setInspector(fork, {
      limit: 4_000_000,
      stack: true,
      steps: true,
    })
    const result = await Evm.callTx(fork, transaction())

    expect(result.trace).toEqual(expected)
  })

  test('behavior: changing the inspector waits for a parked execution', async () => {
    const memory = Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code },
        [inner]: { code: innerCode },
      },
    })
    const fork = await Evm.create({
      database: Database.fromAsync({
        getAccount: async (address) => memory.getAccount(address),
        getBlockHash: async (number) => memory.getBlockHash(number),
        getCodeByHash: async (codeHash) => memory.getCodeByHash(codeHash),
        getStorage: async (address, key) => memory.getStorage(address, key),
      }),
    })
    await Evm.setInspector(fork, {})

    // Started, not awaited: the execution parks on its first uncached read, so
    // an unqueued clear would land in the middle of it and drop the recording.
    const executing = Evm.callTx(fork, transaction())
    const cleared = Evm.clearInspector(fork)

    const result = await executing
    await cleared

    expect(result.trace?.events.map((event) => event.kind)).toEqual([
      'call',
      'log',
      'call',
      'callEnd',
      'callEnd',
    ])
    // The clear took effect once the execution finished with it.
    expect(Evm.callTx(fork, transaction({ nonce: 0n }))).toBeInstanceOf(Promise)
    expect((await Evm.callTx(fork, transaction())).trace).toBeUndefined()
  })
})
