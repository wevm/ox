import { Address, Bytes, Hash, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as codec from '../internal/codec.js'
import * as Database from '../internal/database.js'
import * as engine from '../internal/engine.js'

const emptyCodeHash = Hash.keccak256('0x')

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const recipient = '0x00000000000000000000000000000000000000bb' as const

/** In-memory source with counters, so cache behavior is observable. */
function source(
  accounts: Record<string, Database.Account & { code?: Bytes.Bytes }> = {},
) {
  const reads = {
    getAccount: 0,
    getBlockHash: 0,
    getCodeByHash: 0,
    getStorage: 0,
  }
  const code = new Map<string, Bytes.Bytes>()
  for (const account of Object.values(accounts))
    if (account.code) code.set(account.codeHash.toLowerCase(), account.code)

  const database: Database.Database = {
    getAccount(address) {
      reads.getAccount++
      const account = accounts[address.toLowerCase()]
      if (!account) return undefined
      return {
        balance: account.balance,
        codeHash: account.codeHash,
        nonce: account.nonce,
      }
    },
    getBlockHash() {
      reads.getBlockHash++
      return `0x${'00'.repeat(32)}`
    },
    getCodeByHash(codeHash) {
      reads.getCodeByHash++
      const found = code.get(codeHash.toLowerCase())
      if (!found) throw new Error(`no code for ${codeHash}`)
      return found
    },
    getStorage() {
      reads.getStorage++
      return 0n
    },
  }
  return { database, reads }
}

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

/** A signed legacy transfer, plus its recovered signer. */
function transfer(options: { nonce?: bigint; to?: Address.Address } = {}) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 100_000n,
    gasPrice: 0n,
    nonce: options.nonce ?? 0n,
    to: options.to ?? recipient,
    value: 1_000n,
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

function funded() {
  return source({
    [sender.toLowerCase()]: {
      balance: 10n ** 18n,
      codeHash: emptyCodeHash,
      nonce: 0n,
    },
  })
}

describe('create', () => {
  test('runs an osaka transfer through host state reads', async () => {
    const { database, reads } = funded()
    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })

    const result = evm.callTx(transfer())

    expect(result).toMatchInlineSnapshot(`
      {
        "createdAddress": undefined,
        "errorCode": undefined,
        "floorGas": 21000n,
        "logs": [],
        "output": "0x",
        "refunded": 0n,
        "stateGasSpent": 0n,
        "status": true,
        "stop": 1,
        "totalGasSpent": 21000n,
      }
    `)
    expect(reads).toMatchInlineSnapshot(`
      {
        "getAccount": 3,
        "getBlockHash": 0,
        "getCodeByHash": 0,
        "getStorage": 0,
      }
    `)
  })

  test('runs the same transfer on cancun and prague', async () => {
    for (const spec of ['cancun', 'prague'] as const) {
      const { database } = funded()
      const evm = await engine.create({
        block,
        chainId: 1n,
        database,
        specId: codec.specId[spec],
      })
      const result = evm.callTx(transfer())
      expect([spec, result.status, result.totalGasSpent]).toEqual([
        spec,
        true,
        21_000n,
      ])
    }
  })

  test('accepts every specification evm2 declares', async () => {
    for (const [name, spec] of Object.entries(codec.specId)) {
      const { database } = funded()
      const evm = await engine.create({
        block,
        chainId: 1n,
        database,
        specId: spec,
      })
      // A specification whose precompile or handler tables trapped would take
      // the instance down rather than return, so reaching here is the assertion.
      expect([name, typeof evm.callTx]).toEqual([name, 'function'])
    }
  })

  test('error: unknown specification', async () => {
    const { database } = funded()
    await expect(
      engine.create({
        block,
        chainId: 1n,
        database,
        specId: codec.specId.amsterdam + 1,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [Evm.AbiError: The evm2 adapter rejected the request.

      unknown spec id 15]
    `)
  })
})

describe('callTx', () => {
  test('discards state, so a repeated transfer sees the same nonce', async () => {
    const { database } = funded()
    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })

    expect(evm.callTx(transfer()).totalGasSpent).toBe(21_000n)
    expect(evm.callTx(transfer()).totalGasSpent).toBe(21_000n)
  })

  test('runs code loaded by hash', async () => {
    // PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
    const code = Bytes.fromHex('0x602a5f5260205ff3')
    const codeHash = Hash.keccak256(Hex.fromBytes(code))
    const { database, reads } = source({
      [sender.toLowerCase()]: {
        balance: 10n ** 18n,
        codeHash: emptyCodeHash,
        nonce: 0n,
      },
      [recipient]: { balance: 0n, code, codeHash, nonce: 0n },
    })

    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })
    const result = evm.callTx(transfer())

    expect(result.status).toBe(true)
    expect(result.output).toBe(Hex.fromNumber(42, { size: 32 }))
    expect(reads.getCodeByHash).toBe(1)
  })

  test('error: rejects a transaction the sender cannot pay for', async () => {
    const { database } = source({
      [sender.toLowerCase()]: {
        balance: 0n,
        codeHash: emptyCodeHash,
        nonce: 0n,
      },
    })
    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })

    expect(() => evm.callTx(transfer())).toThrowErrorMatchingInlineSnapshot(
      `
      [Evm.HandlerError: insufficient funds

      evm2 handler error 9]
    `,
    )
  })

  test('error: surfaces the source failure, not the abort', async () => {
    const { database } = funded()
    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })

    const failing: Database.Database = {
      ...database,
      getAccount() {
        throw new Error('upstream is down')
      },
    }
    const broken = await engine.create({
      block,
      chainId: 1n,
      database: failing,
      specId: codec.specId.osaka,
    })

    expect(() => broken.callTx(transfer())).toThrowErrorMatchingInlineSnapshot(
      `[Error: upstream is down]`,
    )
    // The aborted attempt left nothing behind, so a working engine still agrees.
    expect(evm.callTx(transfer()).totalGasSpent).toBe(21_000n)
  })
})

describe('setBlock', () => {
  test('replaces the block environment and specification in place', async () => {
    const { database } = funded()
    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })
    expect(evm.callTx(transfer()).totalGasSpent).toBe(21_000n)

    evm.setBlock({
      block: { ...block, number: 2n, timestamp: 2n },
      chainId: 1n,
      specId: codec.specId.cancun,
    })
    // Cancun has no EIP-7623 floor, so the same transfer reports none.
    expect(evm.callTx(transfer())).toMatchObject({
      floorGas: 0n,
      totalGasSpent: 21_000n,
    })
  })

  test('error: rejects a chain id the transaction does not match', async () => {
    const { database } = funded()
    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })
    evm.setBlock({ block, chainId: 10n, specId: codec.specId.osaka })

    expect(() => evm.callTx(transfer())).toThrowErrorMatchingInlineSnapshot(`
      [Evm.HandlerError: invalid chain id: expected 10, got 1

      evm2 handler error 6]
    `)
  })
})

describe('destroy', () => {
  test('error: rejects work after the engine is dropped', async () => {
    const { database } = funded()
    const evm = await engine.create({
      block,
      chainId: 1n,
      database,
      specId: codec.specId.osaka,
    })
    evm.destroy()

    expect(() => evm.callTx(transfer())).toThrowErrorMatchingInlineSnapshot(`
      [Evm.MissingError: The evm2 engine was destroyed.

      Create a new engine to execute another transaction.]
    `)
  })
})
