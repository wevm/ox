import { Address, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Building an envelope from transaction fields.
 *
 * The fields form is a convenience over the serialized one, so what it accepts
 * has to reach evm2 as the same EIP-2718 bytes a caller would have encoded.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

function evm(chainId?: bigint) {
  return Evm.create({
    ...(chainId ? { chainId } : {}),
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code: '0x00' },
      },
    }),
  })
}

describe('fields', () => {
  test('behavior: an explicit undefined chain id falls back to the EVM default', async () => {
    // Chain 7, so a shadowed undefined would not match and evm2 would reject.
    const instance = await evm(7n)

    // A caller spreading a request object can carry `chainId: undefined`, which
    // must not shadow the EVM's own.
    const result = Evm.callTx(instance, {
      chainId: undefined,
      from: sender,
      gas: 200_000n,
      // Fee fields infer EIP-1559, which requires a chain id, unlike legacy.
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      to: target,
      value: 0n,
    } as never)

    expect(result.status).toBe(true)
  })

  test('behavior: a chain id past the envelope limit is refused clearly', async () => {
    const instance = await evm(9_007_199_254_740_993n)

    // Envelope types carry a number, so the fields form cannot express this.
    // Refusing beats silently rounding to a different chain.
    expect(() =>
      Evm.callTx(instance, {
        from: sender,
        gas: 200_000n,
        gasPrice: 0n,
        nonce: 0n,
        to: target,
        value: 0n,
      } as never),
    ).toThrowError(Evm.EncodeError)
  })
})

describe('blob transactions', () => {
  test('behavior: sidecars are dropped rather than rejected', async () => {
    const instance = await evm()

    // A blob transaction object from the p2p path carries sidecars. The EIP-4844
    // serializer emits the pooled wrapper for them, which is not the envelope the
    // adapter decodes, and they are irrelevant to execution either way.
    const result = Evm.callTx(instance, {
      blobVersionedHashes: [`0x01${'11'.repeat(31)}`],
      from: sender,
      gas: 200_000n,
      maxFeePerBlobGas: 1n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      sidecars: [],
      to: target,
      value: 0n,
    } as never)

    expect(result.status).toBe(true)
  })
})

describe('legacy bytecode', () => {
  test('behavior: code starting with the delegation prefix still executes', async () => {
    // `0xef01` without the rest of a designator is ordinary legacy code, which
    // genesis and pre-EIP-3541 state can hold. It has to run as legacy — hitting
    // an invalid opcode — rather than failing the account read.
    const odd = '0x00000000000000000000000000000000000000c7' as const
    const instance = await Evm.create({
      database: {
        getAccount: (address) =>
          address.toLowerCase() === odd
            ? {
                balance: 0n,
                code: new Uint8Array([0xef, 0x01]),
                codeHash: `0x${'ab'.repeat(32)}`,
                nonce: 0n,
              }
            : address.toLowerCase() === sender.toLowerCase()
              ? {
                  balance: 10n ** 18n,
                  codeHash: `0x${'00'.repeat(32)}`,
                  nonce: 0n,
                }
              : undefined,
        getBlockHash: () => `0x${'00'.repeat(32)}`,
        getCodeByHash: () => new Uint8Array([0xef, 0x01]),
        getStorage: () => 0n,
      },
    })

    const envelope = TxEnvelopeLegacy.from({
      chainId: 1,
      gas: 200_000n,
      gasPrice: 0n,
      nonce: 0n,
      to: odd,
      value: 0n,
    })
    const signature = Secp256k1.sign({
      payload: TxEnvelopeLegacy.getSignPayload(envelope),
      privateKey,
    })
    const result = Evm.callTx(instance, {
      from: sender,
      serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
    })

    // Executed and reverted on the invalid opcode, rather than a database error.
    expect(result.status).toBe(false)
  })
})
