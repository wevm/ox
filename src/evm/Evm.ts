import type * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as TxEnvelope from '../core/TxEnvelope.js'
import * as Database from './Database.js'
import * as ExecutedTx from './ExecutedTx.js'
import type * as Ethereum from './Ethereum.js'
import * as SpecId from './SpecId.js'
import * as TxResult from './TxResult.js'
import * as engine from './internal/engine.js'

import type {
  ReentrancyError,
  RequestTooLargeError,
} from './internal/bindings.js'
import type { EncodeError } from './internal/codec.js'
import type {
  AbiError,
  BorrowedError,
  DatabaseError,
  HandlerError,
} from './internal/engine.js'

export {
  AbiError,
  BorrowedError,
  DatabaseError,
  HandlerError,
  MissingError,
  NotExecutedError,
} from './internal/engine.js'
export { EncodeError } from './internal/codec.js'
export { ReentrancyError, RequestTooLargeError } from './internal/bindings.js'

/**
 * An EVM.
 *
 * Owns its specification, block environment, and the state accepted above its
 * database. One EVM is one isolated engine: creating a second does not share
 * state with the first.
 */
export type Evm = {
  /** @internal */
  readonly '~chainId': bigint
  /** @internal */
  readonly '~engine': engine.Engine
}

/** Block values opcodes read. */
export type Block = {
  /** `BASEFEE`. @default 0n */
  basefee?: bigint | undefined
  /** `COINBASE`. @default the zero address */
  beneficiary?: Address.Address | undefined
  /** `BLOBBASEFEE`. @default 1n */
  blobBasefee?: bigint | undefined
  /** `DIFFICULTY`, pre-merge. @default 0n */
  difficulty?: bigint | undefined
  /** `GASLIMIT`. @default 30_000_000n */
  gasLimit?: bigint | undefined
  /** `NUMBER`. @default 0n */
  number?: bigint | undefined
  /** `PREVRANDAO`, post-merge. @default 0n */
  prevrandao?: bigint | undefined
  /** Beacon slot number. @default 0n */
  slotNum?: bigint | undefined
  /** `TIMESTAMP`. @default 0n */
  timestamp?: bigint | undefined
}

/**
 * Creates an EVM.
 *
 * Asynchronous because the engine is WebAssembly and browsers refuse to compile
 * a module this size synchronously on the main thread. The module is compiled
 * once per JavaScript realm; every call afterwards is synchronous.
 *
 * The specification selects the instruction table, gas schedule, precompiles,
 * and transaction handlers. Choosing among compiled precompile sets or handler
 * registries arrives with the configuration surface; until then the
 * specification determines all of them.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * const evm = await Evm.create()
 * ```
 *
 * @example
 * ### Seeding state
 *
 * ```ts twoslash
 * import { Database, Evm } from 'ox/evm'
 *
 * const evm = await Evm.create({
 *   database: Database.fromMemory({
 *     accounts: {
 *       '0x0000000000000000000000000000000000000001': {
 *         balance: 1n
 *       }
 *     }
 *   })
 * })
 * ```
 *
 * @param options - Constructor components.
 * @returns An EVM.
 */
export async function create(options: create.Options = {}): Promise<Evm> {
  const {
    block,
    chainId,
    database = Database.fromMemory(),
    specId = SpecId.latest,
  } = options

  return {
    '~chainId': chainId ?? 1n,
    '~engine': await engine.create({
      block: {
        basefee: block?.basefee ?? 0n,
        beneficiary: block?.beneficiary ?? `0x${'00'.repeat(20)}`,
        blobBasefee: block?.blobBasefee ?? 1n,
        difficulty: block?.difficulty ?? 0n,
        gasLimit: block?.gasLimit ?? 30_000_000n,
        number: block?.number ?? 0n,
        prevrandao: block?.prevrandao ?? 0n,
        slotNum: block?.slotNum ?? 0n,
        timestamp: block?.timestamp ?? 0n,
      },
      chainId: chainId ?? 1n,
      database,
      specId: SpecId.ids.indexOf(specId),
    }),
  }
}

export declare namespace create {
  type Options = {
    /** Block values opcodes read. */
    block?: Block | undefined
    /**
     * Chain id `CHAINID` reports and transactions are validated against.
     *
     * @default 1n
     */
    chainId?: bigint | undefined
    /**
     * State the EVM reads through.
     *
     * An empty in-memory database by default, holding no accounts. evm2 reads a
     * missing account as balance and nonce zero, so a transaction that costs
     * nothing still executes; anything needing funds fails until state is
     * seeded.
     *
     * @default Database.fromMemory()
     */
    database?: Database.Database | undefined
    /**
     * Specification whose rules apply.
     *
     * @default SpecId.latest
     */
    specId?: SpecId.SpecId | undefined
  }

  type ErrorType = EncodeError | Errors.GlobalErrorType
}

/**
 * Executes a transaction and discards its state changes.
 *
 * This is evm2's `call_tx`: a fully validated transaction whose state changes are
 * discarded. Nonce, chain id, balance, and intrinsic gas are all checked, so it
 * is stricter than an `eth_call`, and it takes an encoded envelope with its
 * signer rather than a loose message. Output, gas, and logs come back, nothing
 * written is kept, and executing the same transaction twice gives the same
 * result.
 *
 * A revert or an exceptional halt is a successful call returning
 * `status: false`. It throws only when evm2 refused the transaction, or when the
 * database could not supply state.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Database, Evm, TxResult } from 'ox/evm'
 *
 * const evm = await Evm.create({ database, specId: 'osaka' })
 *
 * const result = Evm.callTx(evm, {
 *   from: '0x0000000000000000000000000000000000000001',
 *   gas: 100_000n,
 *   to: '0x0000000000000000000000000000000000000002',
 *   value: 1n
 * })
 * TxResult.txGasUsed(result)
 * // @log: 21000n
 * ```
 *
 * @param evm - EVM to execute on.
 * @param transaction - Transaction and the account it executes as.
 * @returns The transaction's result.
 */
export function callTx(evm: Evm, transaction: Ethereum.Tx): TxResult.TxResult {
  const result = evm['~engine'].callTx({
    envelope: envelope(transaction, evm['~chainId']),
    signer: transaction.from,
  })
  return { ...result, stop: stop(result.stop) }
}

export declare namespace callTx {
  type ErrorType =
    | AbiError
    | BorrowedError
    | DatabaseError
    | HandlerError
    | ReentrancyError
    | RequestTooLargeError
    | UnknownStopError
    | Errors.GlobalErrorType
}

/**
 * Executes a transaction and leaves its state changes pending.
 *
 * The counterpart to {@link ox#Evm.(callTx:function)}: instead of discarding
 * what the transaction wrote, this hands back a handle that decides. The EVM is
 * held until that handle is committed, discarded, or detached, so only one
 * transaction is outstanding at a time.
 *
 * A revert or an exceptional halt is a successful execution returning
 * `status: false`, and still produces a handle to resolve.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * // `using` discards on scope exit, so an early return cannot leave the EVM held.
 * using executed = Evm.transact(evm, {
 *   from: '0x0000000000000000000000000000000000000001',
 *   gas: 100_000n,
 *   to: '0x0000000000000000000000000000000000000002',
 *   value: 1n
 * })
 *
 * if (ExecutedTx.result(executed).status)
 *   ExecutedTx.commit(executed)
 * ```
 *
 * @param evm - EVM to execute on.
 * @param transaction - Transaction and the account it executes as.
 * @returns A handle over the executed transaction.
 */
export function transact(
  evm: Evm,
  transaction: Ethereum.Tx,
): ExecutedTx.ExecutedTx {
  const { result, token } = evm['~engine'].transact({
    envelope: envelope(transaction, evm['~chainId']),
    signer: transaction.from,
  })
  const normalized = (() => {
    try {
      return { ...result, stop: stop(result.stop) }
    } catch (error) {
      // The engine is already borrowed, so release it before reporting.
      evm['~engine'].resolve('discard', token)
      throw error
    }
  })()
  return ExecutedTx.from({
    engine: evm['~engine'],
    result: normalized,
    token,
  })
}

export declare namespace transact {
  type ErrorType =
    | AbiError
    | BorrowedError
    | DatabaseError
    | HandlerError
    | ReentrancyError
    | RequestTooLargeError
    | UnknownStopError
    | Errors.GlobalErrorType
}

/**
 * Reads an account through the EVM, including any state it has accepted.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.readAccountInfo(
 *   evm,
 *   '0x0000000000000000000000000000000000000001'
 * )
 * ```
 *
 * @param evm - EVM to read through.
 * @param address - Account to read.
 * @returns The account, or `undefined` when it does not exist.
 */
export function readAccountInfo(
  evm: Evm,
  address: Address.Address,
): Database.Account | undefined {
  return evm['~engine'].readAccountInfo(address)
}

export declare namespace readAccountInfo {
  type ErrorType =
    | AbiError
    | BorrowedError
    | DatabaseError
    | HandlerError
    | ReentrancyError
    | Errors.GlobalErrorType
}

/**
 * Placeholder signature for a transaction built from fields.
 *
 * EIP-2718 decoding needs a signature to parse, and evm2 strips it immediately,
 * so nothing reads this. Callers therefore never sign to simulate.
 */
const placeholder = {
  r: `0x${'01'.repeat(32)}`,
  s: `0x${'01'.repeat(32)}`,
  yParity: 0,
} as const

// Resolves either input shape to the encoded envelope the ABI carries.
function envelope(tx: Ethereum.Tx, chainId: bigint): Bytes.Bytes {
  // Fields carry an index signature, so `in` alone cannot narrow the union; the
  // value's own shape is what distinguishes an already-encoded transaction.
  const serialized = (tx as Ethereum.Tx.Serialized).serialized
  if (typeof serialized === 'string' || serialized instanceof Uint8Array)
    return Bytes.from(serialized)

  const { from: _, ...fields } = tx
  // Fields with no fee fields infer EIP-1559, whose serialization needs a chain
  // id, so the EVM's own is the default rather than a required argument.
  return Bytes.from(
    TxEnvelope.serialize(
      TxEnvelope.from({ chainId: Number(chainId), ...fields }),
      { signature: placeholder },
    ),
  )
}

/** evm2's stop discriminants, keyed by the name they map to. */
const names = /*#__PURE__*/ new Map(
  Object.entries(TxResult.stops).map(([name, value]) => [
    value as number,
    name as TxResult.Stop,
  ]),
)

function stop(discriminant: number): TxResult.Stop {
  const name = names.get(discriminant)
  if (!name) throw new UnknownStopError({ discriminant })
  return name
}

/** Thrown when the engine reports a stop reason this version does not know. */
export class UnknownStopError extends Errors.BaseError {
  override readonly name = 'Evm.UnknownStopError'

  constructor({ discriminant }: { discriminant: number }) {
    super('The engine reported an unknown stop reason.', {
      metaMessages: [
        `Received: ${discriminant}`,
        'The engine and this package may be out of sync.',
      ],
    })
  }
}
