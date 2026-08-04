import { Address, Bytes, Hash, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { describe, expect, test, vi } from 'vp/test'
import { wasmBase64 } from '../../wasm/internal/evm2.wasm.js'
import * as instantiate from '../../wasm/internal/instantiate.js'
import * as codec from '../internal/codec.js'
import * as engine from '../internal/engine.js'

const emptyCodeHash = Hash.keccak256('0x')
const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

// PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
const code = Bytes.fromHex('0x602a5f5260205ff3')
const codeHash = Hash.keccak256(Hex.fromBytes(code))

function transfer() {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 100_000n,
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
    envelope: Bytes.fromHex(
      TxEnvelopeLegacy.serialize(envelope, { signature }),
    ),
    signer: sender,
  }
}

function create() {
  return engine.create({
    block: {
      basefee: 0n,
      beneficiary: '0x00000000000000000000000000000000000000cb',
      blobBasefee: 1n,
      difficulty: 0n,
      gasLimit: 30_000_000n,
      number: 0n,
      prevrandao: 0n,
      slotNum: 0n,
      timestamp: 0n,
    },
    chainId: 1n,
    database: {
      getAccount: (address) =>
        address.toLowerCase() === sender.toLowerCase()
          ? { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
          : { balance: 0n, codeHash, nonce: 0n },
      getBlockHash: () => `0x${'00'.repeat(32)}`,
      getCodeByHash: () => code,
      getStorage: () => 0n,
    },
    specId: codec.specId.osaka,
  })
}

describe('create', () => {
  test('behavior: compiles asynchronously', async () => {
    // Browsers refuse to compile a module this size synchronously on the main
    // thread, so `new WebAssembly.Module` must never be reached.
    const Module = vi.spyOn(globalThis.WebAssembly, 'Module')
    const Instance = vi.spyOn(globalThis.WebAssembly, 'Instance')
    try {
      const evm = await create()
      expect(Module).not.toHaveBeenCalled()
      expect(Instance).not.toHaveBeenCalled()
      expect(evm.callTx(transfer()).output).toBe(
        Hex.fromNumber(42, { size: 32 }),
      )
    } finally {
      Module.mockRestore()
      Instance.mockRestore()
    }
  })

  test('behavior: decodes the artifact through the atob fallback', async () => {
    // Edge runtimes have `atob` but no `Buffer`, and older ones lack
    // `Uint8Array.fromBase64`. Compilation is memoized, so this goes at the
    // decoder directly rather than through the engine.
    const fromBase64 = Object.getOwnPropertyDescriptor(Uint8Array, 'fromBase64')
    const buffer = Object.getOwnPropertyDescriptor(globalThis, 'Buffer')
    if (fromBase64) Reflect.deleteProperty(Uint8Array, 'fromBase64')
    if (buffer) Reflect.deleteProperty(globalThis, 'Buffer')
    try {
      const compiled = await instantiate.compile(wasmBase64)
      expect(
        WebAssembly.Module.imports(compiled)
          .map((entry) => `${entry.module}.${entry.name}`)
          .sort(),
      ).toEqual([
        'ox_evm2.get_account',
        'ox_evm2.get_block_hash',
        'ox_evm2.get_code_by_hash',
        'ox_evm2.get_storage',
      ])
    } finally {
      if (fromBase64)
        Object.defineProperty(Uint8Array, 'fromBase64', fromBase64)
      if (buffer) Object.defineProperty(globalThis, 'Buffer', buffer)
    }
  })
})
