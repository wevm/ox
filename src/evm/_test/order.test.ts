import { Address, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx, StateChange } from 'ox/evm'
import { expect, test } from 'vp/test'

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

function evm() {
  return Evm.create({
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code: '0x60015f55' },
      },
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
function recorder(into: string[]) {
  return {
    account: (c: { address: string }) => into.push(`account:${c.address}`),
    accountRead: (c: { address: string }) =>
      into.push(`accountRead:${c.address}`),
    bytecode: (h: string) => into.push(`bytecode:${h}`),
    storage: (c: { address: string }) => into.push(`storage:${c.address}`),
    storageRead: (c: { address: string }) =>
      into.push(`storageRead:${c.address}`),
    storageWipe: (a: string) => into.push(`wipe:${a}`),
  }
}

test('visit replays the order a streamed resolution observes', async () => {
  const streamed: string[] = []
  const a = await evm()
  ExecutedTx.commitWith(Evm.transact(a, transaction()), recorder(streamed))

  const visited: string[] = []
  const b = await evm()
  const { pendingState } = ExecutedTx.detach(Evm.transact(b, transaction()))
  StateChange.visit(pendingState, recorder(visited))

  // The detached state keeps loaded-but-unchanged accounts that the live stream
  // elides, which is evm2's own behavior on the two paths. Order is what has to
  // agree: a sink applying storage before finalizing accounts sees one sequence.
  expect(visited.slice(0, streamed.length)).toEqual(streamed)
  expect(
    visited.every(
      (record, index) =>
        index < streamed.length || record.startsWith('accountRead:'),
    ),
  ).toBe(true)
})
