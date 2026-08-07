import { Address, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx } from 'ox/evm'
import { expect, test } from 'vp/test'

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
      getAccount: async (a) => memory.getAccount(a),
      getBlockHash: async (n) => memory.getBlockHash(n),
      getCodeByHash: async (h) => memory.getCodeByHash(h),
      getStorage: async (a, k) => memory.getStorage(a, k),
    }),
  })
}
function transaction(nonce = 0n) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 200_000n,
    gasPrice: 0n,
    nonce,
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

test('an operation submitted while a handle is outstanding is refused', async () => {
  const evm = await asyncEvm()
  const executed = await Evm.transact(evm, transaction())

  // Submitted while the handle is outstanding. Synchronously this throws
  // BorrowedError; queued, it must not succeed against post-resolution state.
  const queued = Evm.callTx(evm, transaction(1n))
  ExecutedTx.commit(executed)

  await expect(queued).rejects.toThrowError(Evm.BorrowedError)
})
