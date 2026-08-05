import { Address, Bytes, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx, PendingState, StateChange } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

/**
 * Returns slot 0's previous value, then writes 42 to it.
 *
 * PUSH0 SLOAD, PUSH0 MSTORE, PUSH1 42 PUSH0 SSTORE, PUSH1 32 PUSH0 RETURN.
 * Reading the old value is what makes a commit observable: a later transaction
 * sees 42 only if the first one's state was accepted.
 */
const code = '0x5f545f52602a5f5560205ff3' as const

function transaction(options: { nonce?: bigint } = {}) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 100_000n,
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

async function evm() {
  return Evm.create({
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code },
      },
    }),
  })
}

const zero = Hex.fromNumber(0, { size: 32 })
const answer = Hex.fromNumber(42, { size: 32 })

describe('commit', () => {
  test('behavior: a later transaction sees the committed state', async () => {
    const instance = await evm()

    const first: ExecutedTx.ExecutedTx = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(first).output).toBe(zero)
    ExecutedTx.commit(first)

    // The nonce advanced with the commit, so the second transaction uses 1.
    const second = Evm.transact(instance, transaction({ nonce: 1n }))
    expect(ExecutedTx.result(second).output).toBe(answer)
    ExecutedTx.commit(second)

    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(2n)
  })
})

describe('discard', () => {
  test('behavior: a later transaction does not see discarded state', async () => {
    const instance = await evm()

    ExecutedTx.discard(Evm.transact(instance, transaction()))

    // The nonce did not advance either, so this reuses nonce 0.
    const second = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(second).output).toBe(zero)
    ExecutedTx.discard(second)

    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(0n)
  })
})

describe('detach', () => {
  test('behavior: state leaves the EVM without being accepted', async () => {
    const instance = await evm()

    const { pendingState, result } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )
    expect(result.output).toBe(zero)
    expect(PendingState.isEmpty(pendingState)).toBe(false)

    // Detaching is not committing: the EVM never accepted the write.
    const second = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(second).output).toBe(zero)
    ExecutedTx.discard(second)
  })

  test('behavior: the detached state carries the slot write', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    const storage: StateChange.Storage[] = []
    StateChange.visit(pendingState, {
      storage(change) {
        storage.push(change)
      },
    })

    expect(storage.filter((change) => change.address.toLowerCase() === target))
      .toMatchInlineSnapshot(`
        [
          {
            "address": "0x00000000000000000000000000000000000000c0",
            "current": 42n,
            "key": 0n,
            "original": 0n,
          },
        ]
      `)
  })

  test('behavior: reports the sender balance the transaction left', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    // Zero-priced gas, so the only account change is the nonce.
    expect(PendingState.accountInfo(pendingState, sender))
      .toMatchInlineSnapshot(`
      {
        "balance": 1000000000000000000n,
        "codeHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "nonce": 1n,
      }
    `)
  })

  test('behavior: an untouched account is absent', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    expect(
      PendingState.accountInfo(
        pendingState,
        '0x000000000000000000000000000000000000dead',
      ),
    ).toBeUndefined()
  })
})

describe('lifecycle', () => {
  test('behavior: a second execution while a handle is outstanding throws', async () => {
    const instance = await evm()
    const executed = Evm.transact(instance, transaction())

    // evm2 holds the EVM's exclusive borrow until the handle resolves, which the
    // binding has to enforce rather than the compiler.
    expect(() => Evm.transact(instance, transaction({ nonce: 1n })))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.BorrowedError: An executed transaction has not been resolved.

      Commit, discard, or detach it before using the EVM again.]
    `)

    ExecutedTx.discard(executed)
  })

  test('behavior: reading through the EVM while borrowed throws', async () => {
    const instance = await evm()
    const executed = Evm.transact(instance, transaction())

    expect(() => Evm.readAccountInfo(instance, sender))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.BorrowedError: An executed transaction has not been resolved.

      Commit, discard, or detach it before using the EVM again.]
    `)

    ExecutedTx.discard(executed)
  })

  test('behavior: a resolved handle cannot be resolved again', async () => {
    const instance = await evm()
    const executed = Evm.transact(instance, transaction())
    ExecutedTx.commit(executed)

    expect(() => ExecutedTx.commit(executed))
      .toThrowErrorMatchingInlineSnapshot(`
      [ExecutedTx.ResolvedError: This transaction was already resolved.

      It was committed, discarded, or detached, and cannot be resolved again.]
    `)
    expect(() => ExecutedTx.discard(executed))
      .toThrowErrorMatchingInlineSnapshot(`
      [ExecutedTx.ResolvedError: This transaction was already resolved.

      It was committed, discarded, or detached, and cannot be resolved again.]
    `)
  })

  test('behavior: the result stays readable after resolving', async () => {
    const instance = await evm()
    const executed = Evm.transact(instance, transaction())
    ExecutedTx.commit(executed)

    // evm2's `result` does not consume the handle, so neither does this.
    expect(ExecutedTx.result(executed).output).toBe(zero)
  })

  test('behavior: an unresolved handle discards when its scope exits', async () => {
    const instance = await evm()
    expect(typeof Symbol.dispose).toBe('symbol')

    {
      using executed = Evm.transact(instance, transaction())
      expect(ExecutedTx.result(executed).output).toBe(zero)
    }

    // Scope exit discarded rather than committed, so the EVM is usable and the
    // write is gone.
    const second = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(second).output).toBe(zero)
    ExecutedTx.discard(second)
  })

  test('behavior: scope exit after an explicit resolution does nothing', async () => {
    const instance = await evm()

    {
      using executed = Evm.transact(instance, transaction())
      ExecutedTx.commit(executed)
    }

    // Dispose must not discard what was committed, nor throw for resolving twice.
    const second = Evm.transact(instance, transaction({ nonce: 1n }))
    expect(ExecutedTx.result(second).output).toBe(answer)
    ExecutedTx.discard(second)
  })
})

describe('StateChange.tee', () => {
  test('behavior: forwards every change to both sinks', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    const a: string[] = []
    const b: string[] = []
    StateChange.visit(
      pendingState,
      StateChange.tee(
        { storage: (change) => a.push(change.address) },
        { storage: (change) => b.push(change.address) },
      ),
    )

    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
  })
})

describe('commitWith', () => {
  test('behavior: streams the changes, then accepts them', async () => {
    const instance = await evm()

    const storage: StateChange.Storage[] = []
    ExecutedTx.commitWith(Evm.transact(instance, transaction()), {
      storage(change) {
        storage.push(change)
      },
    })

    expect(storage.filter((change) => change.address.toLowerCase() === target))
      .toMatchInlineSnapshot(`
        [
          {
            "address": "0x00000000000000000000000000000000000000c0",
            "current": 42n,
            "key": 0n,
            "original": 0n,
          },
        ]
      `)

    // Committed, so the write is visible and the nonce advanced.
    const second = Evm.transact(instance, transaction({ nonce: 1n }))
    expect(ExecutedTx.result(second).output).toBe(answer)
    ExecutedTx.discard(second)
  })

  test('behavior: a sink that throws discards instead of committing', async () => {
    const instance = await evm()

    // evm2's rule: a failing sink means the transaction is not committed. The
    // sink's own error surfaces rather than the resulting status.
    expect(() =>
      ExecutedTx.commitWith(Evm.transact(instance, transaction()), {
        storage() {
          throw new Error('sink refused')
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: sink refused]`)

    // Not committed: the write is gone and the nonce never advanced.
    const second = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(second).output).toBe(zero)
    ExecutedTx.discard(second)
    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(0n)
  })
})

describe('discardWith', () => {
  test('behavior: streams the changes without accepting them', async () => {
    const instance = await evm()

    const seen: StateChange.Storage[] = []
    ExecutedTx.discardWith(Evm.transact(instance, transaction()), {
      storage(change) {
        seen.push(change)
      },
    })

    expect(seen.some((change) => change.current === 42n)).toBe(true)

    // Observed but not accepted.
    const second = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(second).output).toBe(zero)
    ExecutedTx.discard(second)
  })
})

describe('handle identity', () => {
  test('behavior: a copied handle cannot resolve a later transaction', async () => {
    const instance = await evm()

    const first: ExecutedTx.ExecutedTx = Evm.transact(instance, transaction())
    const copy = { ...first }

    // The copy has its own `~resolved` flag but the same token, so resolving it
    // releases the transaction it belongs to.
    ExecutedTx.discard(copy)

    // A new transaction is now outstanding. The original handle must not resolve
    // it, even though its own flag says unresolved.
    const second = Evm.transact(instance, transaction())
    expect(() => ExecutedTx.commit(first)).toThrowErrorMatchingInlineSnapshot(`
      [Evm.NotExecutedError: There is no executed transaction to resolve.

      It was already committed, discarded, or detached.]
    `)

    ExecutedTx.discard(second)
  })
})

describe('sink contract', () => {
  test('behavior: an async sink is refused and the transaction discarded', async () => {
    const instance = await evm()

    // evm2 decides whether to commit as each record returns, so a promise that
    // settles later could not stop a commit that already happened.
    expect(() =>
      ExecutedTx.commitWith(Evm.transact(instance, transaction()), {
        async storage() {
          await Promise.resolve()
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ExecutedTx.AsyncSinkError: A state-change sink returned a promise.

      Sinks are synchronous: evm2 decides whether to commit as each record returns.
      The transaction was discarded.]
    `)

    const second = Evm.transact(instance, transaction())
    expect(ExecutedTx.result(second).output).toBe(zero)
    ExecutedTx.discard(second)
    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(0n)
  })

  test('behavior: streaming and visiting hand a sink the same shape', async () => {
    const streamed: StateChange.Storage[] = []
    ExecutedTx.discardWith(Evm.transact(await evm(), transaction()), {
      storage(change) {
        streamed.push(change)
      },
    })

    const visited: StateChange.Storage[] = []
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(await evm(), transaction()),
    )
    StateChange.visit(pendingState, {
      storage(change) {
        visited.push(change)
      },
    })

    // Neither path may leak the wire's routing tag.
    expect(streamed).toEqual(visited)
    expect(Object.keys(streamed[0]!).sort()).toMatchInlineSnapshot(`
      [
        "address",
        "current",
        "key",
        "original",
      ]
    `)
  })
})

describe('sink record kinds', () => {
  /** Initcode returning `PUSH1 42 PUSH0 MSTORE PUSH1 32 PUSH0 RETURN`. */
  const initcode = '0x67602a5f5260205ff35f5260086018f3' as const
  /** Constructor SSTOREs a slot then SELFDESTRUCTs to the caller. */
  const destructor = '0x60015f5533ff' as const

  function create(data: Hex.Hex, value = 0n) {
    const envelope = TxEnvelopeLegacy.from({
      chainId: 1,
      data,
      gas: 1_000_000n,
      gasPrice: 0n,
      nonce: 0n,
      value,
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

  async function senderOnly() {
    return Evm.create({
      database: Database.fromMemory({
        accounts: { [sender.toLowerCase()]: { balance: 10n ** 18n } },
      }),
    })
  }

  test('behavior: a create streams bytecode and a created account', async () => {
    const instance = await senderOnly()

    const kinds: string[] = []
    let deployed: Bytes.Bytes | undefined
    let created = false
    ExecutedTx.commitWith(Evm.transact(instance, create(initcode)), {
      account(change) {
        kinds.push('account')
        created ||= change.created === true
      },
      accountRead() {
        kinds.push('accountRead')
      },
      bytecode(_codeHash, code) {
        kinds.push('bytecode')
        deployed = code
      },
    })

    expect(created).toBe(true)
    expect(deployed && Hex.fromBytes(deployed)).toBe('0x602a5f5260205ff3')
    expect(kinds).toContain('bytecode')
  })

  test('behavior: a same-transaction selfdestruct streams a storage wipe', async () => {
    const instance = await senderOnly()

    // Created and destroyed in one transaction nets to no account change, so
    // the live stream reports only the wipe; the flag lives on detached state.
    const wipes: string[] = []
    ExecutedTx.discardWith(Evm.transact(instance, create(destructor, 1n)), {
      storageWipe(address) {
        wipes.push(address)
      },
    })
    expect(wipes.length).toBe(1)
  })

  test('behavior: detached state records the selfdestruct flag', async () => {
    const instance = await senderOnly()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, create(destructor, 1n)),
    )

    let selfdestructed = false
    StateChange.visit(pendingState, {
      account(change) {
        selfdestructed ||= change.selfdestructed === true
      },
    })
    expect(selfdestructed).toBe(true)
  })

  test('behavior: streaming and visiting emit one sequence', async () => {
    const trace = (sink: (event: string) => void): StateChange.Sink => ({
      account: (change) => sink(`account:${change.address}`),
      accountRead: (change) => sink(`accountRead:${change.address}`),
      bytecode: (codeHash) => sink(`bytecode:${codeHash}`),
      storage: (change) => sink(`storage:${change.address}:${change.key}`),
      storageRead: (change) =>
        sink(`storageRead:${change.address}:${change.key}`),
      storageWipe: (address) => sink(`wipe:${address}`),
    })

    const streamed: string[] = []
    ExecutedTx.discardWith(
      Evm.transact(await senderOnly(), create(initcode)),
      trace((event) => streamed.push(event)),
    )

    const visited: string[] = []
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(await senderOnly(), create(initcode)),
    )
    StateChange.visit(
      pendingState,
      trace((event) => visited.push(event)),
    )

    // The two paths are different evm2 sources: detached state additionally
    // reports loads the live stream elides (a fee-recipient read, net-no-op
    // accounts). What both report must arrive in the same relative order.
    const common = visited.filter((event) => streamed.includes(event))
    expect(common).toEqual(streamed)
    expect(streamed.length).toBeGreaterThan(2)

    // Detached replay is deterministic: evm2 documents PendingState's visit
    // order, and ours is its recording.
    const again: string[] = []
    const second = ExecutedTx.detach(
      Evm.transact(await senderOnly(), create(initcode)),
    )
    StateChange.visit(
      second.pendingState,
      trace((event) => again.push(event)),
    )
    expect(again).toEqual(visited)
  })
})

describe('isolation', () => {
  test('behavior: a borrowed EVM does not affect a sibling instance', async () => {
    const a = await evm()
    const b = await evm()

    const executed = Evm.transact(a, transaction())
    // `a` is held; `b` is a separate engine and stays fully usable.
    expect(Evm.callTx(b, transaction()).status).toBe(true)
    ExecutedTx.discard(executed)
  })
})
