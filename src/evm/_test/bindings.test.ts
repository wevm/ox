import { Address, Bytes, Hash, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as bindings from '../internal/bindings.js'
import * as codec from '../internal/codec.js'
import type * as Database from '../internal/database.js'
import * as engine from '../internal/engine.js'

const emptyCodeHash = Hash.keccak256('0x')

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const recipient = '0x00000000000000000000000000000000000000bb' as const

const block: codec.Block = {
  basefee: 0n,
  beneficiary: '0x00000000000000000000000000000000000000cc',
  blobBasefee: 1n,
  difficulty: 0n,
  gasLimit: 30_000_000n,
  number: 1n,
  prevrandao: 0n,
  slotNum: 0n,
  timestamp: 1n,
}

/** A funded source whose reads can be replaced per test. */
function database(
  overrides: Partial<Database.Database> = {},
): Database.Database {
  return {
    getAccount(address) {
      if (address.toLowerCase() !== sender.toLowerCase()) return undefined
      return { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
    },
    getBlockHash() {
      return `0x${'00'.repeat(32)}`
    },
    getCodeByHash() {
      return new Uint8Array()
    },
    getStorage() {
      return 0n
    },
    ...overrides,
  }
}

/**
 * A signed legacy transaction carrying `data` bytes of calldata.
 *
 * `gas` stays well under EIP-7825's per-transaction cap, which Osaka enforces
 * below the block gas limit.
 */
function transaction(data: Bytes.Bytes = new Uint8Array(), gas = 100_000n) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    data: Hex.fromBytes(data),
    gas,
    gasPrice: 0n,
    nonce: 0n,
    to: recipient,
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

/** A raw instance, for requests the codec would never produce. */
async function instance() {
  const raw = await bindings.instantiateWith(database())
  raw.call(
    codec.encodeCreate({ block, chainId: 1n, specId: codec.specId.osaka }),
  )
  return raw
}

/** Builds a request header by hand. */
function request(options: {
  flags?: number | undefined
  length?: number | undefined
  magic?: number | undefined
  op: number
  payload?: Bytes.Bytes | undefined
  version?: number | undefined
}) {
  const payload = options.payload ?? new Uint8Array()
  const bytes = new Uint8Array(codec.headerSize + payload.length)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, options.magic ?? codec.magic, true)
  view.setUint16(4, options.version ?? codec.version, true)
  view.setUint16(6, options.op, true)
  view.setUint32(8, options.flags ?? 0, true)
  view.setUint32(12, options.length ?? payload.length, true)
  bytes.set(payload, codec.headerSize)
  return bytes
}

describe('instantiateWith', () => {
  test('publishes only the ABI version the codec speaks', async () => {
    const compiled = await bindings.compile()
    const exports = WebAssembly.Module.exports(compiled).map(
      (entry) => `${entry.name}:${entry.kind}`,
    )
    expect(exports).toMatchInlineSnapshot(`
      [
        "memory:memory",
        "ox_abi_version:function",
        "ox_alloc:function",
        "ox_call:function",
        "ox_reset:function",
      ]
    `)
  })

  test('imports nothing beyond the host state reads', async () => {
    const compiled = await bindings.compile()
    const imports = WebAssembly.Module.imports(compiled)
      .map((entry) => `${entry.module}.${entry.name}`)
      .sort()
    expect(imports).toMatchInlineSnapshot(`
      [
        "ox_evm2.get_account",
        "ox_evm2.get_block_hash",
        "ox_evm2.get_code_by_hash",
        "ox_evm2.get_storage",
      ]
    `)
  })

  test('compiles once per realm', async () => {
    expect(await bindings.compile()).toBe(await bindings.compile())
  })
})

describe('call', () => {
  test('rejects a foreign magic', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(
      request({ magic: 0xdead_beef, op: codec.op.destroy }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"expected magic 0x324d5645, got 0xdeadbeef"`,
    )
  })

  test('rejects another ABI version', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(
      request({ op: codec.op.destroy, version: 2 }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"expected ABI version 1, got 2"`,
    )
  })

  test('rejects reserved header flags', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(
      request({ flags: 1, op: codec.op.destroy }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"reserved header flags must be zero, got 0x1"`,
    )
  })

  test('rejects a length the payload does not back', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(
      request({ length: 64, op: codec.op.destroy }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"header declared 64 payload bytes, got 0"`,
    )
  })

  test('rejects an unknown operation', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(request({ op: 0xff }))
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"unknown operation 255"`,
    )
  })

  test('rejects trailing payload bytes', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(
      request({ op: codec.op.destroy, payload: new Uint8Array(4) }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"request payload had 4 trailing bytes"`,
    )
  })

  test('rejects a truncated operation payload', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(
      request({ op: codec.op.callTx, payload: new Uint8Array(8) }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"request payload ended early"`,
    )
  })

  test('rejects an envelope that is not EIP-2718', async () => {
    const raw = await instance()
    const { payload, status } = raw.call(
      codec.encodeCallTx({
        envelope: Bytes.fromHex('0xdeadbeef'),
        signer: sender,
      }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"transaction envelope is not valid EIP-2718"`,
    )
  })

  test('rejects a request over the maximum', async () => {
    const raw = await instance()
    expect(() => raw.call(new Uint8Array(codec.maxRequest + 1)))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.RequestTooLargeError: The request is larger than the evm2 adapter accepts.

      Requested: 67108865 bytes
      Maximum: 67108864 bytes]
    `)
  })

  test('reports a missing engine, then works once one exists', async () => {
    const raw = await bindings.instantiateWith(database())
    expect(raw.call(codec.encodeCallTx(transaction())).status).toBe(
      codec.status.engineMissing,
    )
    raw.call(
      codec.encodeCreate({ block, chainId: 1n, specId: codec.specId.osaka }),
    )
    expect(raw.call(codec.encodeCallTx(transaction())).status).toBe(
      codec.status.ok,
    )
  })

  test('keeps working after a rejected request', async () => {
    const raw = await instance()
    expect(raw.call(request({ op: 0xff })).status).toBe(codec.status.abi)
    expect(raw.call(codec.encodeCallTx(transaction())).status).toBe(
      codec.status.ok,
    )
  })

  test('survives the memory growth a large request forces', async () => {
    const raw = await instance()

    // A mebibyte of calldata grows linear memory well past its initial pages,
    // which detaches every view taken before the call. Anything much larger
    // cannot pay its intrinsic gas under EIP-7825's per-transaction cap.
    const large = raw.call(
      codec.encodeCallTx(transaction(new Uint8Array(2 ** 20), 16_000_000n)),
    )
    expect(large.status).toBe(codec.status.ok)
    expect(codec.decodeResult(large.payload).status).toBe(true)

    // The small path still decodes, so no stale view survived the growth.
    const small = raw.call(codec.encodeCallTx(transaction()))
    expect(codec.decodeResult(small.payload).totalGasSpent).toBe(21_000n)
  })

  test('runs repeatedly on one engine without drift', async () => {
    const raw = await instance()
    const gas = new Set<bigint>()
    for (let index = 0; index < 32; index++)
      gas.add(
        codec.decodeResult(raw.call(codec.encodeCallTx(transaction())).payload)
          .totalGasSpent,
      )
    expect([...gas]).toEqual([21_000n])
  })

  test('releases its buffers on reset and keeps executing', async () => {
    const raw = await instance()
    raw.call(codec.encodeCallTx(transaction(new Uint8Array(1024))))
    raw.reset()
    expect(raw.call(codec.encodeCallTx(transaction())).status).toBe(
      codec.status.ok,
    )
  })
})

describe('reentrancy', () => {
  test('refuses a state read that executes on the engine reading it', async () => {
    let reentrant: engine.Engine | undefined
    const source = database({
      getAccount(address) {
        reentrant?.callTx(transaction())
        if (address.toLowerCase() !== sender.toLowerCase()) return undefined
        return { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
      },
    })

    reentrant = await engine.create({
      block,
      chainId: 1n,
      database: source,
      specId: codec.specId.osaka,
    })

    expect(() => reentrant?.callTx(transaction()))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.ReentrancyError: The evm2 engine is already executing.

      A state read cannot execute a transaction on the engine that is reading it.]
    `)
  })
})

describe('review fixes', () => {
  test('error: rejects a specification beyond the wire width', async () => {
    const { database: source } = { database: database() }
    await expect(
      engine.create({
        block,
        chainId: 1n,
        database: source,
        // Truncation would silently select Amsterdam.
        specId: 2 ** 32 + codec.specId.amsterdam,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [Evm.EncodeError: A value does not fit the width this ABI encodes it at.

      Value:   4294967310
      Maximum: 4294967295]
    `)
  })

  test('error: rejects a chain id beyond the wire width', async () => {
    await expect(
      engine.create({
        block,
        // Truncation would silently become chain 1.
        chainId: 2n ** 64n + 1n,
        database: database(),
        specId: codec.specId.osaka,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [Evm.EncodeError: A value does not fit the width this ABI encodes it at.

      Value:   18446744073709551617
      Maximum: 18446744073709551615]
    `)
  })

  test('error: rejects bytes trailing the transaction envelope', async () => {
    const raw = await instance()
    const { envelope, signer } = transaction()
    const trailing = new Uint8Array(envelope.length + 4)
    trailing.set(envelope)
    trailing.set([0xde, 0xad, 0xbe, 0xef], envelope.length)

    const { payload, status } = raw.call(
      codec.encodeCallTx({ envelope: trailing, signer }),
    )
    expect(status).toBe(codec.status.abi)
    expect(codec.decodeMessage(payload)).toMatchInlineSnapshot(
      `"transaction envelope is not valid EIP-2718"`,
    )
  })

  test('classifies an EIP-7702 delegation instead of forcing legacy', async () => {
    // A designator executed as legacy code would hit `0xef` as an invalid
    // opcode; delegating reaches the target, which returns 42.
    const target = '0x00000000000000000000000000000000000000d0' as const
    const delegated = Bytes.fromHex('0x602a5f5260205ff3')
    const designator = Bytes.fromHex(`0xef0100${target.slice(2)}`)
    const designatorHash = Hash.keccak256(Hex.fromBytes(designator))
    const delegatedHash = Hash.keccak256(Hex.fromBytes(delegated))

    const evm = await engine.create({
      block,
      chainId: 1n,
      database: database({
        getAccount(address) {
          if (address.toLowerCase() === sender.toLowerCase())
            return { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
          if (address.toLowerCase() === recipient)
            return { balance: 0n, codeHash: designatorHash, nonce: 0n }
          if (address.toLowerCase() === target)
            return { balance: 0n, codeHash: delegatedHash, nonce: 0n }
          return undefined
        },
        getCodeByHash(codeHash) {
          if (codeHash.toLowerCase() === designatorHash.toLowerCase())
            return designator
          if (codeHash.toLowerCase() === delegatedHash.toLowerCase())
            return delegated
          throw new Error(`no code for ${codeHash}`)
        },
      }),
      specId: codec.specId.prague,
    })

    const result = evm.callTx(transaction())
    expect(result.status).toBe(true)
    expect(result.output).toBe(Hex.fromNumber(42, { size: 32 }))
  })

  test('loads code larger than any fork lets a contract deploy', async () => {
    // `get_code_by_hash` returns code that already exists in state, so it is not
    // bounded by the active fork's deployment limit. The engine grows its
    // landing buffer and retries.
    const oversized = new Uint8Array(80_000)
    oversized[0] = 0x00 // STOP
    const codeHash = Hash.keccak256(Hex.fromBytes(oversized))

    const evm = await engine.create({
      block,
      chainId: 1n,
      database: database({
        getAccount(address) {
          if (address.toLowerCase() === sender.toLowerCase())
            return { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
          return { balance: 0n, codeHash, nonce: 0n }
        },
        getCodeByHash: () => oversized,
      }),
      specId: codec.specId.osaka,
    })

    expect(evm.callTx(transaction()).status).toBe(true)
  })
})

describe('source value widths', () => {
  test('error: rejects a nonce beyond the u64 range', async () => {
    const evm = await engine.create({
      block,
      chainId: 1n,
      database: database({
        // Truncation would present this to evm2 as nonce zero.
        getAccount: () => ({
          balance: 10n ** 18n,
          codeHash: emptyCodeHash,
          nonce: 2n ** 64n,
        }),
      }),
      specId: codec.specId.osaka,
    })

    expect(() => evm.callTx(transaction())).toThrowErrorMatchingInlineSnapshot(`
      [Evm.EncodeError: A value does not fit the width this ABI encodes it at.

      Value:   nonce 18446744073709551616
      Maximum: 18446744073709551615]
    `)
  })

  test('error: rejects a code hash that is not 32 bytes', async () => {
    const evm = await engine.create({
      block,
      chainId: 1n,
      database: database({
        // `Bytes.fromHex` would right-pad this to a different hash entirely.
        getAccount: () => ({
          balance: 10n ** 18n,
          codeHash: '0x1234',
          nonce: 0n,
        }),
      }),
      specId: codec.specId.osaka,
    })

    expect(() => evm.callTx(transaction())).toThrowErrorMatchingInlineSnapshot(`
      [Evm.EncodeError: A value does not fit the width this ABI encodes it at.

      Value:   codeHash 2 bytes
      Maximum: 32 bytes]
    `)
  })
})

describe('inline account code', () => {
  // PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
  const code = Bytes.fromHex('0x602a5f5260205ff3')
  const codeHash = Hash.keccak256(Hex.fromBytes(code))

  /** A source that answers by address only, as JSON-RPC does. */
  function byAddress(reads: { getCodeByHash: number }) {
    return database({
      getAccount(address) {
        if (address.toLowerCase() === sender.toLowerCase())
          return { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
        if (address.toLowerCase() === recipient)
          return { balance: 0n, code, codeHash, nonce: 0n }
        return undefined
      },
      getCodeByHash() {
        reads.getCodeByHash++
        throw new Error('a source keyed by address cannot resolve code by hash')
      },
    })
  }

  test('runs code supplied with the account, without a hash lookup', async () => {
    const reads = { getCodeByHash: 0 }
    const evm = await engine.create({
      block,
      chainId: 1n,
      database: byAddress(reads),
      specId: codec.specId.osaka,
    })

    const result = evm.callTx(transaction())
    expect(result.status).toBe(true)
    expect(result.output).toBe(Hex.fromNumber(42, { size: 32 }))
    // evm2 files inline code under its hash, so the second read never happens.
    expect(reads.getCodeByHash).toBe(0)
  })

  test('still falls back to the hash lookup when code is omitted', async () => {
    const reads = { getCodeByHash: 0 }
    const evm = await engine.create({
      block,
      chainId: 1n,
      database: database({
        getAccount(address) {
          if (address.toLowerCase() === sender.toLowerCase())
            return { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
          return { balance: 0n, codeHash, nonce: 0n }
        },
        getCodeByHash() {
          reads.getCodeByHash++
          return code
        },
      }),
      specId: codec.specId.osaka,
    })

    expect(evm.callTx(transaction()).output).toBe(
      Hex.fromNumber(42, { size: 32 }),
    )
    expect(reads.getCodeByHash).toBe(1)
  })

  test('grows for inline code larger than the landing buffer', async () => {
    const large = new Uint8Array(80_000)
    large.set(code)
    const largeHash = Hash.keccak256(Hex.fromBytes(large))
    const evm = await engine.create({
      block,
      chainId: 1n,
      database: database({
        getAccount(address) {
          if (address.toLowerCase() === sender.toLowerCase())
            return { balance: 10n ** 18n, codeHash: emptyCodeHash, nonce: 0n }
          return { balance: 0n, code: large, codeHash: largeHash, nonce: 0n }
        },
        getCodeByHash() {
          throw new Error('inline code should not need a hash lookup')
        },
      }),
      specId: codec.specId.osaka,
    })

    expect(evm.callTx(transaction()).output).toBe(
      Hex.fromNumber(42, { size: 32 }),
    )
  })
})
