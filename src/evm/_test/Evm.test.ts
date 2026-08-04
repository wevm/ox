import { Address, Bytes, Hash, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, SpecId, TxResult } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

/** PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN */
const code = '0x602a5f5260205ff3' as const

function transaction(
  options: { chainId?: number; to?: Address.Address; value?: bigint } = {},
) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: options.chainId ?? 1,
    gas: 100_000n,
    gasPrice: 0n,
    nonce: 0n,
    to: options.to ?? target,
    value: options.value ?? 0n,
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

function database() {
  return Database.fromMemory({
    accounts: {
      [sender.toLowerCase()]: { balance: 10n ** 18n },
      [target]: { code },
    },
  })
}

async function evm(specId: SpecId.SpecId = 'osaka') {
  return Evm.create({ database: database(), specId })
}

describe('create', () => {
  test('default', async () => {
    // Only state is required: the specification defaults to the newest.
    const instance = await Evm.create({ database: database() })
    expect(Evm.callTx(instance, transaction()).status).toBe(true)
  })

  test('behavior: the specification selects the handler set', async () => {
    // Cancun has no EIP-7702 handler, so a Prague-only feature is unavailable
    // there. The specification is the only thing that decides it.
    expect(Evm.callTx(await evm('cancun'), transaction()).status).toBe(true)
  })
})

describe('callTx', () => {
  test('default', async () => {
    const result = Evm.callTx(await evm(), transaction())
    expect({ ...result, logs: result.logs.length }).toMatchInlineSnapshot(`
      {
        "createdAddress": undefined,
        "errorCode": undefined,
        "floorGas": 21000n,
        "logs": 0,
        "output": "0x000000000000000000000000000000000000000000000000000000000000002a",
        "refunded": 0n,
        "stateGasSpent": 0n,
        "status": true,
        "stop": "return",
        "totalGasSpent": 21016n,
      }
    `)
  })

  test('behavior: names the stop reason', async () => {
    // PUSH1 32, PUSH0, REVERT
    const reverting = await Evm.create({
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [target]: { code: '0x60205ffd' },
        },
      }),
      specId: 'osaka',
    })
    const result = Evm.callTx(reverting, transaction())
    expect([result.status, result.stop]).toMatchInlineSnapshot(`
      [
        false,
        "revert",
      ]
    `)
  })

  test('behavior: discards state, so a repeat call agrees', async () => {
    const instance = await evm()
    expect(Evm.callTx(instance, transaction()).totalGasSpent).toBe(
      Evm.callTx(instance, transaction()).totalGasSpent,
    )
  })

  test('behavior: runs under every specification', async () => {
    for (const specId of ['cancun', 'prague', 'osaka'] as const)
      expect([
        specId,
        Evm.callTx(await evm(specId), transaction()).status,
      ]).toEqual([specId, true])
  })

  test('behavior: chain id defaults to mainnet and can be set', async () => {
    const instance = await Evm.create({
      database: database(),
      chainId: 10n,
    })
    expect(Evm.callTx(instance, transaction({ chainId: 10 })).status).toBe(true)
  })

  test('error: rejects a transaction for another chain', async () => {
    const instance = await evm()
    expect(() => Evm.callTx(instance, transaction({ chainId: 10 })))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.HandlerError: invalid chain id: expected 1, got 10

      evm2 handler error 6]
    `)
  })

  test('error: a transaction the sender cannot pay for', async () => {
    // Gas is free at a zero price, so the value transfer is what it cannot fund.
    const broke = await Evm.create({
      database: Database.fromMemory({ accounts: { [target]: { code } } }),
      specId: 'osaka',
    })
    expect(() => Evm.callTx(broke, transaction({ value: 1000n })))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.HandlerError: insufficient funds

      evm2 handler error 9]
    `)
  })
})

describe('readAccountInfo', () => {
  test('default', async () => {
    const account = Evm.readAccountInfo(await evm(), target)
    expect(account).toEqual({
      balance: 0n,
      // evm2 files loaded code in a cache keyed by its hash and clears the
      // account's own field, so the hash identifies the code and `code` is
      // absent. Read it with `Database.getCodeByHash` when the bytes are needed.
      code: undefined,
      codeHash: Hash.keccak256(code),
      nonce: 0n,
    })
  })

  test('behavior: undefined for an account that does not exist', async () => {
    expect(
      Evm.readAccountInfo(
        await evm(),
        '0x00000000000000000000000000000000000000ff',
      ),
    ).toBeUndefined()
  })
})

describe('TxResult', () => {
  test('gas helpers', async () => {
    const result = Evm.callTx(await evm(), transaction())
    expect([
      TxResult.txGasUsed(result),
      TxResult.regularGasSpent(result),
      TxResult.stateGasSpent(result),
    ]).toMatchInlineSnapshot(`
      [
        21016n,
        21016n,
        0n,
      ]
    `)
  })
})

describe('SpecId', () => {
  test('enables', () => {
    expect([
      SpecId.enables('osaka', 'cancun'),
      SpecId.enables('cancun', 'osaka'),
      SpecId.latest,
    ]).toMatchInlineSnapshot(`
      [
        true,
        false,
        "osaka",
      ]
    `)
  })
})

describe('defaults', () => {
  test('behavior: an EVM with no arguments is complete but holds no state', async () => {
    const empty = await Evm.create()

    // A free transaction still executes: a missing account reads as balance and
    // nonce zero, which covers a transfer that costs nothing.
    expect(Evm.callTx(empty, transaction()).status).toBe(true)

    // Anything needing funds is what surfaces the empty state.
    expect(() => Evm.callTx(empty, transaction({ value: 1n })))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.HandlerError: insufficient funds

      evm2 handler error 9]
    `)
  })

  test('behavior: defaults to the newest specification', async () => {
    // Osaka charges an EIP-7623 floor that Cancun does not, so the default is
    // observable rather than nominal.
    const [latest, cancun] = [
      Evm.callTx(await Evm.create({ database: database() }), transaction()),
      Evm.callTx(
        await Evm.create({ database: database(), specId: 'cancun' }),
        transaction(),
      ),
    ]
    expect([latest.floorGas > 0n, cancun.floorGas]).toEqual([true, 0n])
  })
})

describe('Database.fromMemory', () => {
  test('behavior: copies seeded code, so a later mutation cannot desync it', async () => {
    const bytes = Uint8Array.from(Bytes.fromHex(code))
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [target]: { code: bytes },
        },
      }),
    })

    // Mutating the caller's array must not change the account's code, which its
    // hash already commits to.
    bytes.fill(0xfe)
    expect(Evm.callTx(instance, transaction()).output).toBe(
      Hex.fromNumber(42, { size: 32 }),
    )
  })
})

describe('Database.fromMemory reads', () => {
  test('behavior: hands back copies, so an inspected account cannot be edited', async () => {
    const source = database()

    // Reading an account must not expose the stored array: editing it would
    // change the executed code while `codeHash` still committed to the original.
    source.getAccount(target)!.code!.fill(0xfe)
    source.getCodeByHash(Hash.keccak256(code)).fill(0xfe)

    const instance = await Evm.create({ database: source })
    expect(Evm.callTx(instance, transaction()).output).toBe(
      Hex.fromNumber(42, { size: 32 }),
    )
  })

  /** PUSH1 1, NUMBER, SUB, BLOCKHASH, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN */
  const blockHashCode = '0x60014303405f5260205ff3' as const

  function blockHashEvm(blockHashes?: Record<string, Hex.Hex>) {
    return Evm.create({
      block: { number: 1n },
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [target]: { code: blockHashCode },
        },
        ...(blockHashes ? { blockHashes } : {}),
      }),
    })
  }

  test('behavior: an unseeded in-window block hash fails the read', async () => {
    // evm2 range-checks `BLOCKHASH` first, so reaching the database means the
    // chain retains that block. Reporting zero would fabricate chain state.
    const instance = await blockHashEvm()
    expect(() => Evm.callTx(instance, transaction()))
      .toThrowErrorMatchingInlineSnapshot(`
      [Database.MissingBlockHashError: The database has no hash for a block the chain retains.

      Block: 0
      Seed it through \`blockHashes\` to execute this transaction.]
    `)
  })

  test('behavior: a seeded block hash is returned', async () => {
    const blockHash = Hex.fromNumber(7, { size: 32 })
    const instance = await blockHashEvm({ '0': blockHash })
    expect(Evm.callTx(instance, transaction()).output).toBe(blockHash)
  })
})

describe('transaction input', () => {
  test('behavior: executes from fields, with no signing', async () => {
    const instance = await Evm.create({ database: database() })

    // No key, no signature, no serialization: the fields and the sender are all
    // evm2 needs, since it strips any signature the envelope carries.
    const result = Evm.callTx(instance, {
      from: sender,
      gas: 100_000n,
      gasPrice: 0n,
      nonce: 0n,
      to: target,
      value: 0n,
    })

    expect(result.output).toBe(Hex.fromNumber(42, { size: 32 }))
    expect(result.status).toBe(true)
  })

  test('behavior: fields and a serialized envelope agree', async () => {
    const instance = await Evm.create({ database: database() })

    const fields = Evm.callTx(instance, {
      from: sender,
      gas: 100_000n,
      gasPrice: 0n,
      nonce: 0n,
      to: target,
      value: 0n,
    })
    const serialized = Evm.callTx(instance, transaction())

    expect(fields).toEqual(serialized)
  })

  test('behavior: infers the envelope type from the fee fields', async () => {
    const instance = await Evm.create({ database: database() })

    // `maxFeePerGas` makes this EIP-1559 rather than legacy, the same inference
    // `TxEnvelope.from` applies.
    const result = Evm.callTx(instance, {
      chainId: 1,
      from: sender,
      gas: 100_000n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      nonce: 0n,
      to: target,
      value: 0n,
    })

    expect(result.status).toBe(true)
    expect(result.output).toBe(Hex.fromNumber(42, { size: 32 }))
  })
})
