import { Address, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Inputs are read when an operation is submitted, not when it runs.
 *
 * An asynchronous EVM queues every operation, so a closure reading `options.*`
 * later sees whatever the caller did to that object in the meantime. evm2 takes
 * values, so the binding has to as well.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

function asyncEvm() {
  const memory = Database.fromMemory({
    accounts: {
      [sender.toLowerCase()]: { balance: 10n ** 18n },
      [target]: { code: '0x60015f55' },
    },
  })
  return Evm.create({
    database: Database.fromAsync({
      getAccount: async (address) => memory.getAccount(address),
      getBlockHash: async (number) => memory.getBlockHash(number),
      getCodeByHash: async (codeHash) => memory.getCodeByHash(codeHash),
      getStorage: async (address, key) => memory.getStorage(address, key),
    }),
  })
}

function transaction() {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 200_000n,
    gasPrice: 0n,
    nonce: 0n,
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

describe('queued operations', () => {
  test('behavior: an inspector records what was submitted, not what the object became', async () => {
    const evm = await asyncEvm()

    const options = { steps: false }
    const queued = Evm.setInspector(evm, options)
    // Mutated after submitting, before the queue drains.
    options.steps = true
    await queued

    const result = await Evm.callTx(evm, transaction())
    // Submitted with steps off, so no step events regardless of the mutation.
    expect(result.trace?.events.some((event) => event.kind === 'step')).toBe(
      false,
    )
  })

  test('behavior: a block is applied as submitted', async () => {
    const evm = await asyncEvm()

    const block = { number: 5n }
    const queued = Evm.setBlock(evm, block)
    block.number = 99n
    await queued

    // NUMBER returned by the contract would be the observable; the config the
    // EVM holds is the direct one.
    expect(evm['~config'].block.number).toBe(5n)
  })
  test('behavior: a queued spec is not undone by a later setter omitting it', async () => {
    const evm = await asyncEvm()

    // Two setters in one tick: the second omits `specId`, which is documented as
    // leaving it unchanged rather than reverting to what it was at submission.
    const first = Evm.setExecutionConfig(evm, { specId: 'cancun' })
    const second = Evm.setExecutionConfig(evm, {
      version: { maxCodeSize: 1000n },
    })
    await Promise.all([first, second])

    expect(evm['~config'].specId).toBe('cancun')
  })

  test('behavior: a system call executes what was submitted', async () => {
    const evm = await asyncEvm()

    const options: { address: Address.Address; data: '0x01' } = {
      address: target,
      data: '0x01',
    }
    const queued = Evm.systemCall(evm, options)
    options.address = '0x00000000000000000000000000000000000000ff'
    const executed = await queued

    // Targeted the original address, not the mutated one.
    expect(ExecutedTx.result(executed).status).toBe(true)
    ExecutedTx.discard(executed)
  })
})
