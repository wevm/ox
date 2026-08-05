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
