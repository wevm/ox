import * as Address from '../core/Address.js'
import type * as AccessList from '../core/AccessList.js'
import * as Authorization from '../core/Authorization.js'
import * as ContractAddress from '../core/ContractAddress.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as Secp256k1 from '../core/Secp256k1.js'
import * as Signature from '../core/Signature.js'
import * as TxEnvelope from '../core/TxEnvelope.js'
import type { Compute, ExactPartial } from '../core/internal/types.js'
import * as State from './State.js'
import * as Hardfork from './Hardfork.js'
import * as Transaction from './Transaction.js'
import { analyzed } from './internal/analysis.js'
import * as delegation from './internal/delegation.js'
import { table } from './internal/instructions.js'
import { execute } from './internal/interpreter.js'
import * as journal_ from './internal/journal.js'
import {
  addressToWord,
  createFrame,
  halt,
  type Frame,
  type Machine,
} from './internal/machine.js'

/** Why execution stopped exceptionally. Exceptional halts consume all gas. */
export type HaltReason =
  | 'call-depth-exceeded'
  | 'code-size-exceeded'
  | 'create-collision'
  | 'initcode-size-exceeded'
  | 'insufficient-balance'
  | 'invalid-code'
  | 'invalid-jump'
  | 'invalid-opcode'
  | 'memory-limit'
  | 'nonce-overflow'
  | 'out-of-gas'
  | 'returndata-out-of-bounds'
  | 'stack-overflow'
  | 'stack-underflow'
  | 'static-violation'

/** Block environment the block opcodes read. */
export type BlockEnv = Compute<{
  /** `BASEFEE`. */
  baseFeePerGas: bigint
  /** `BLOBBASEFEE`. */
  blobBaseFee: bigint
  /** `COINBASE`. */
  coinbase: Address.Address
  /** `GASLIMIT`. */
  gasLimit: bigint
  /** `NUMBER`. */
  number: bigint
  /** `PREVRANDAO`, as a 32-byte hex value. */
  prevRandao: Hex.Hex
  /** `TIMESTAMP`. */
  timestamp: bigint
}>

/** An execution log. Block metadata does not exist at execution time — for
 * the RPC shape, see `Log.Log` in ox core. */
export type Log = Compute<{
  /** Address the log was emitted from. */
  address: Address.Address
  /** Log data. */
  data: Hex.Hex
  /** Log topics. */
  topics: readonly Hex.Hex[]
}>

/** Execution outcome. Halts are data, not exceptions — see
 * {@link ox#Evm.(assertSuccess:function)} for throwing ergonomics. */
export type Result =
  | Compute<{
      status: 'success'
      /** Data passed to `RETURN`. */
      output: Hex.Hex
      /** Gas consumed. */
      gasUsed: bigint
      /** Accumulated gas refund, applied at transaction settlement. */
      gasRefund: bigint
      /** Logs emitted. */
      logs: readonly Log[]
    }>
  | Compute<{
      status: 'reverted'
      /** Revert reason data passed to `REVERT`. */
      output: Hex.Hex
      /** Gas consumed. */
      gasUsed: bigint
    }>
  | Compute<{
      status: 'halted'
      /** Why execution halted. */
      reason: HaltReason
      /** Gas consumed — the full limit, as exceptional halts consume all gas. */
      gasUsed: bigint
    }>

/** Included transaction outcome after gas settlement and state commitment. */
export type Receipt =
  | Compute<{
      /** Created contract, for a successful create transaction. */
      contractAddress?: Address.Address | undefined
      /** Gas price paid after applying the fee cap. */
      effectiveGasPrice: bigint
      /** Gas consumed after refunds and the calldata floor. */
      gasUsed: bigint
      /** Logs emitted by successful execution. */
      logs: readonly Log[]
      /** Data returned by execution. */
      output: Hex.Hex
      status: 'success'
    }>
  | Compute<{
      /** Gas price paid after applying the fee cap. */
      effectiveGasPrice: bigint
      /** Gas consumed after refunds and the calldata floor. */
      gasUsed: bigint
      /** Revert data. */
      output: Hex.Hex
      status: 'reverted'
    }>
  | Compute<{
      /** Gas price paid after applying the fee cap. */
      effectiveGasPrice: bigint
      /** Gas consumed after refunds and the calldata floor. */
      gasUsed: bigint
      /** Why execution halted. */
      reason: HaltReason
      status: 'halted'
    }>

/** Root type for a configured EVM. */
export type Evm<
  state extends State.Sync = State.Sync,
  transactions extends readonly { type: string }[] = Transaction.Mainnet,
> = Compute<{
  /** Block environment transactions and block opcodes read. */
  block: BlockEnv
  /** Chain ID transactions and `CHAINID` read. */
  chainId: bigint
  /** Hardfork whose rules calls execute under. */
  hardfork: Hardfork.Hardfork
  /** State source calls read without mutating. */
  state: state
  /** Transaction-type pipelines accepted by {@link ox#Evm.(transact:function)}. */
  transactions: transactions
}>

/**
 * Configures an EVM over a synchronous state source.
 *
 * @example
 * ```ts twoslash
 * import { Evm, State } from 'ox/evm'
 *
 * const evm = Evm.from({
 *   hardfork: 'osaka',
 *   state: State.fromMemory()
 * })
 * ```
 *
 * @param options - Options.
 * @returns A configured EVM.
 */
export function from<
  const state extends State.Sync,
  const transactions extends readonly { type: string }[] = Transaction.Mainnet,
>(options: from.Options<state, transactions>): Evm<state, transactions> {
  const hardfork = options.hardfork ?? Hardfork.latest
  Hardfork.atLeast(hardfork, 'cancun')
  return {
    block: blockEnv(options.block),
    chainId: options.chainId ?? 1n,
    hardfork,
    state: State.from(options.state),
    transactions: (options.transactions ??
      Transaction.mainnet()) as transactions,
  }
}

export declare namespace from {
  type Options<
    state extends State.Sync = State.Sync,
    transactions extends readonly { type: string }[] = Transaction.Mainnet,
  > = {
    /** Block environment. Omitted fields default to zero-like values. */
    block?: ExactPartial<BlockEnv> | undefined
    /** Chain ID. @default 1n */
    chainId?: bigint | undefined
    /** Hardfork whose rules calls execute under. @default Hardfork.latest */
    hardfork?: Hardfork.Hardfork | undefined
    /** State source calls read without mutating. */
    state: state
    /** Transaction-type pipelines. @default Transaction.mainnet() */
    transactions?: transactions | undefined
  }

  type ErrorType =
    | Hardfork.UnknownHardforkError
    | State.from.ErrorType
    | Errors.GlobalErrorType
}

function blockEnv(block: ExactPartial<BlockEnv> | undefined): BlockEnv {
  return {
    baseFeePerGas: block?.baseFeePerGas ?? 0n,
    blobBaseFee: block?.blobBaseFee ?? 1n,
    coinbase: block?.coinbase ?? zeroAddress,
    gasLimit: block?.gasLimit ?? 30_000_000n,
    number: block?.number ?? 0n,
    prevRandao: block?.prevRandao ?? Hex.fromNumber(0n, { size: 32 }),
    timestamp: block?.timestamp ?? 0n,
  }
}

/**
 * Executes an ephemeral call against configured state.
 *
 * State changes are visible during execution but are discarded afterward.
 *
 * @example
 * ```ts twoslash
 * import { Evm, State } from 'ox/evm'
 *
 * const to = '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357'
 * const evm = Evm.from({
 *   state: State.fromMemory({
 *     accounts: { [to]: { code: '0x602a5f5260205ff3' } }
 *   })
 * })
 *
 * const result = Evm.call(evm, { to })
 * Evm.assertSuccess(result)
 * result.output
 * // @log: '0x000000000000000000000000000000000000000000000000000000000000002a'
 * ```
 *
 * @param evm - Configured EVM.
 * @param options - Call options.
 * @returns The execution result.
 */
export function call(evm: Evm, options: call.Options): Result {
  const { block, chainId, hardfork, state } = evm
  const from = (options.from ?? zeroAddress).toLowerCase() as Address.Address
  const to = options.to.toLowerCase() as Address.Address
  const code = getCode(state, to)
  const delegatedTo = Hardfork.atLeast(hardfork, 'prague')
    ? delegation.getAddress(code)
    : undefined
  const bytecode = delegatedTo
    ? getCode(state, delegatedTo as Address.Address)
    : code

  const execution = createExecution({
    address: to,
    blobHashes: options.blobHashes,
    block: { ...block, ...options.block },
    bytecode,
    caller: from,
    chainId: options.chainId ?? chainId,
    data: options.data,
    gas: options.gas,
    gasPrice: options.gasPrice,
    hardfork,
    origin: from,
    state,
    value: options.value,
  })

  if (delegatedTo) chargeAccount(execution, delegatedTo)
  transferValue(execution, { from, state, to, value: options.value ?? 0n })
  return executeRun(execution)
}

export declare namespace call {
  type Options = {
    /** Versioned blob hashes for `BLOBHASH`. */
    blobHashes?: readonly Hex.Hex[] | undefined
    /** Block environment. Omitted fields default to zero-like values. */
    block?: ExactPartial<BlockEnv> | undefined
    /** `CHAINID`. @default 1n */
    chainId?: bigint | undefined
    /** Calldata. @default '0x' */
    data?: Hex.Hex | Uint8Array | undefined
    /** Sender exposed through `CALLER` and `ORIGIN`. @default zero address */
    from?: Address.Address | undefined
    /** Gas available to execution. @default 30_000_000n */
    gas?: bigint | undefined
    /** `GASPRICE`. @default 0n */
    gasPrice?: bigint | undefined
    /** Account whose code and storage context execute. */
    to: Address.Address
    /** `CALLVALUE`. @default 0n */
    value?: bigint | undefined
  }

  type ErrorType = run.ErrorType
}

/**
 * Validates, executes, and settles a transaction against configured state.
 *
 * Inclusion failures throw without changing state. Reverts and exceptional
 * halts return receipts after advancing the sender nonce and settling fees.
 *
 * @example
 * ```ts twoslash
 * import { Evm, State } from 'ox/evm'
 *
 * const sender = '0x0000000000000000000000000000000000000001'
 * const evm = Evm.from({ state: State.fromMemory() })
 * const receipt = Evm.transact(evm, {
 *   chainId: 1,
 *   from: sender,
 *   gas: 21_000n,
 *   gasPrice: 0n,
 *   nonce: 0n,
 *   to: '0x0000000000000000000000000000000000000002',
 *   type: 'legacy'
 * })
 * ```
 *
 * @param evm - Configured EVM.
 * @param envelope - Transaction envelope.
 * @returns The settled transaction receipt.
 */
export function transact<
  const state extends State.Sync,
  const transactions extends readonly { type: string }[],
>(
  evm: Evm<state, transactions>,
  envelope: Transaction.EnvelopeOf<transactions>,
): Receipt {
  const envelope_ = envelope as TxEnvelope.TxEnvelope
  const type = TxEnvelope.getType(envelope_)
  const handler = evm.transactions.find((handler) => handler.type === type) as
    | Transaction.Handler<any, any>
    | undefined
  if (!handler) throw new UnsupportedTransactionTypeError({ type })
  const sender = (
    handler.sender
      ? handler.sender(envelope as never)
      : transactionSender(envelope_)
  ).toLowerCase() as Address.Address
  const context = transactionContext(evm, envelope_, sender, type)
  const host: Transaction.Host<TxEnvelope.TxEnvelope> = {
    envelope: envelope_,
    evm,
    execute: () => executeTransaction(context),
    prepare: () => prepareTransaction(context),
    sender,
    settle: (result) => settleTransaction(context, result),
    validate: () => validateTransaction(context),
  }

  if (handler.validate) handler.validate(host as never)
  else host.validate()
  if (handler.prepare) handler.prepare(host as never)
  else host.prepare()
  const result = handler.execute
    ? handler.execute(host as never)
    : host.execute()
  return handler.settle
    ? handler.settle(host as never, result)
    : host.settle(result)
}

export declare namespace transact {
  type ErrorType =
    | InvalidTransactionError
    | UnsupportedTransactionTypeError
    | TxEnvelope.getSignPayload.ErrorType
    | Secp256k1.recoverAddress.ErrorType
    | Errors.GlobalErrorType
}

type TransactionContext = {
  accessList: AccessList.AccessList | undefined
  authorizationList: Authorization.ListSigned
  authorizationRefund: bigint
  blobFee: bigint
  blobHashes: readonly Hex.Hex[]
  createdAddress: Address.Address | undefined
  effectiveGasPrice: bigint
  envelope: TxEnvelope.TxEnvelope
  evm: Evm<State.Sync, readonly { type: string }[]>
  execution: Execution | undefined
  floorGas: bigint
  gasLimit: bigint
  intrinsicGas: bigint
  maxFeePerBlobGas: bigint
  maxFeePerGas: bigint
  sender: Address.Address
  senderNonce: bigint
  transactionCheckpoint: number | undefined
  type: TxEnvelope.Type
  value: bigint
}

function transactionContext(
  evm: Evm<State.Sync, readonly { type: string }[]>,
  envelope: TxEnvelope.TxEnvelope,
  sender: Address.Address,
  type: TxEnvelope.Type,
): TransactionContext {
  const accessList = 'accessList' in envelope ? envelope.accessList : undefined
  const authorizationList =
    'authorizationList' in envelope ? envelope.authorizationList : []
  const blobHashes =
    'blobVersionedHashes' in envelope
      ? (envelope.blobVersionedHashes ?? [])
      : []
  const data = Hex.toBytes(envelope.data ?? envelope.input ?? '0x')
  const gas = Hardfork.gas(evm.hardfork)
  let zero = 0
  for (const byte of data) if (byte === 0) zero++
  const nonzero = data.length - zero
  const create = !envelope.to
  let intrinsicGas = gas.txGas
  intrinsicGas +=
    BigInt(zero) * gas.txDataZeroGas + BigInt(nonzero) * gas.txDataNonzeroGas
  if (create) intrinsicGas += gas.txCreateGas
  if (create)
    intrinsicGas += BigInt(Math.ceil(data.length / 32)) * gas.initcodeWordGas
  for (const item of accessList ?? []) {
    intrinsicGas += gas.accessListAddressGas
    intrinsicGas +=
      BigInt(item.storageKeys.length) * gas.accessListStorageKeyGas
  }
  intrinsicGas +=
    BigInt(authorizationList.length) * (gas.authorizationGas ?? 0n)
  const floorGas = gas.floorTokenGas
    ? gas.txGas + (BigInt(zero) + BigInt(nonzero) * 4n) * gas.floorTokenGas
    : 0n
  const legacyGasPrice = 'gasPrice' in envelope ? (envelope.gasPrice ?? 0n) : 0n
  const maxFeePerGas =
    'maxFeePerGas' in envelope ? (envelope.maxFeePerGas ?? 0n) : legacyGasPrice
  const maxPriorityFeePerGas =
    'maxPriorityFeePerGas' in envelope
      ? (envelope.maxPriorityFeePerGas ?? 0n)
      : legacyGasPrice
  const availableTip = maxFeePerGas - evm.block.baseFeePerGas
  const effectiveGasPrice =
    type === 'legacy' || type === 'eip2930'
      ? legacyGasPrice
      : evm.block.baseFeePerGas +
        (availableTip < maxPriorityFeePerGas
          ? availableTip
          : maxPriorityFeePerGas)
  const maxFeePerBlobGas =
    'maxFeePerBlobGas' in envelope ? (envelope.maxFeePerBlobGas ?? 0n) : 0n
  const blobFee =
    BigInt(blobHashes.length) * gas.blob.gasPerBlob * evm.block.blobBaseFee

  return {
    accessList,
    authorizationList,
    authorizationRefund: 0n,
    blobFee,
    blobHashes,
    createdAddress: undefined,
    effectiveGasPrice,
    envelope,
    evm,
    execution: undefined,
    floorGas,
    gasLimit: envelope.gas ?? evm.block.gasLimit,
    intrinsicGas,
    maxFeePerBlobGas,
    maxFeePerGas,
    sender,
    senderNonce: envelope.nonce ?? 0n,
    transactionCheckpoint: undefined,
    type,
    value: envelope.value ?? 0n,
  }
}

function validateTransaction(context: TransactionContext): void {
  const {
    authorizationList,
    blobHashes,
    envelope,
    evm,
    floorGas,
    gasLimit,
    intrinsicGas,
    maxFeePerBlobGas,
    maxFeePerGas,
    sender,
    senderNonce,
    type,
    value,
  } = context
  const { block, chainId, hardfork, state } = evm
  const gas = Hardfork.gas(hardfork)
  const requiredGas = intrinsicGas > floorGas ? intrinsicGas : floorGas
  if (gasLimit < requiredGas)
    throw new InvalidTransactionError({ reason: 'intrinsic-gas-too-low' })
  if (gasLimit > block.gasLimit)
    throw new InvalidTransactionError({ reason: 'block-gas-limit-exceeded' })
  if (gas.txGasLimitCap && gasLimit > gas.txGasLimitCap)
    throw new InvalidTransactionError({
      reason: 'transaction-gas-limit-exceeded',
    })
  if (BigInt(envelope.chainId ?? chainId) !== chainId)
    throw new InvalidTransactionError({ reason: 'chain-id-mismatch' })
  if (maxFeePerGas < block.baseFeePerGas)
    throw new InvalidTransactionError({ reason: 'fee-cap-below-base-fee' })
  const maxPriorityFeePerGas =
    'maxPriorityFeePerGas' in envelope
      ? (envelope.maxPriorityFeePerGas ?? 0n)
      : maxFeePerGas
  if (maxPriorityFeePerGas < 0n)
    throw new InvalidTransactionError({ reason: 'negative-priority-fee' })
  if (maxPriorityFeePerGas > maxFeePerGas)
    throw new InvalidTransactionError({ reason: 'tip-above-fee-cap' })
  if (senderNonce >= (1n << 64n) - 1n)
    throw new InvalidTransactionError({ reason: 'nonce-overflow' })

  const account = state.getAccount(sender)
  if ((account?.nonce ?? 0n) !== senderNonce)
    throw new InvalidTransactionError({ reason: 'nonce-mismatch' })
  const code = account?.code ?? (account ? state.getCode(sender) : '0x')
  const delegating =
    Hardfork.atLeast(hardfork, 'prague') &&
    Hex.size(code) === 23 &&
    code.toLowerCase().startsWith('0xef0100')
  if (code !== '0x' && !delegating)
    throw new InvalidTransactionError({ reason: 'sender-has-code' })

  if (type === 'eip4844') {
    if (!Hardfork.atLeast(hardfork, 'cancun'))
      throw new InvalidTransactionError({ reason: 'transaction-type-disabled' })
    if (!envelope.to)
      throw new InvalidTransactionError({ reason: 'blob-create' })
    if (
      blobHashes.length === 0 ||
      blobHashes.length > gas.blob.max ||
      blobHashes.length > gas.blob.maxPerTransaction
    )
      throw new InvalidTransactionError({ reason: 'blob-count' })
    for (const hash of blobHashes)
      if (Hex.size(hash) !== 32 || !hash.startsWith('0x01'))
        throw new InvalidTransactionError({ reason: 'blob-versioned-hash' })
    if (maxFeePerBlobGas < block.blobBaseFee)
      throw new InvalidTransactionError({ reason: 'blob-fee-cap' })
  }
  if (type === 'eip7702') {
    if (!Hardfork.atLeast(hardfork, 'prague'))
      throw new InvalidTransactionError({ reason: 'transaction-type-disabled' })
    if (authorizationList.length === 0 || !envelope.to)
      throw new InvalidTransactionError({ reason: 'authorization-list' })
  }
  if (
    !envelope.to &&
    Hex.size(envelope.data ?? envelope.input ?? '0x') > 49_152
  )
    throw new InvalidTransactionError({ reason: 'initcode-size-exceeded' })
  if (value < 0n)
    throw new InvalidTransactionError({ reason: 'negative-value' })

  const gasAllowance = gasLimit * maxFeePerGas
  const blobAllowance =
    BigInt(blobHashes.length) * gas.blob.gasPerBlob * maxFeePerBlobGas
  if ((account?.balance ?? 0n) < gasAllowance + blobAllowance + value)
    throw new InvalidTransactionError({ reason: 'insufficient-funds' })
}

function prepareTransaction(context: TransactionContext): void {
  const {
    accessList,
    blobFee,
    blobHashes,
    effectiveGasPrice,
    envelope,
    evm,
    gasLimit,
    intrinsicGas,
    sender,
    senderNonce,
    value,
  } = context
  const { block, chainId, hardfork, state } = evm
  const create = !envelope.to
  const to = create
    ? ContractAddress.fromCreate({ from: sender, nonce: senderNonce })
    : ((envelope.to as Address.Address).toLowerCase() as Address.Address)
  const bytecode = create
    ? Hex.toBytes(envelope.data ?? envelope.input ?? '0x')
    : getCode(state, to)
  const execution = createExecution({
    address: to,
    blobHashes,
    block,
    bytecode,
    caller: sender,
    chainId,
    createdAddress: create ? to : undefined,
    data: create ? '0x' : (envelope.data ?? envelope.input),
    gas: gasLimit - intrinsicGas,
    gasPrice: effectiveGasPrice,
    hardfork,
    origin: sender,
    state,
    value,
  })
  context.execution = execution
  if (create) context.createdAddress = to

  const journal = execution.machine.journal
  seedAccount(journal, state, sender)
  seedAccount(journal, state, block.coinbase.toLowerCase() as Address.Address)
  seedAccount(journal, state, to)
  const senderAccount = journal_.getAccount(journal, sender)
  journal_.setBalance(
    journal,
    sender,
    (senderAccount?.balance ?? 0n) - gasLimit * effectiveGasPrice - blobFee,
  )
  journal_.setNonce(journal, sender, senderNonce + 1n)

  for (const item of accessList ?? []) {
    const address = item.address.toLowerCase()
    journal_.warmAddress(journal, address)
    for (const key of item.storageKeys)
      journal_.warmSlot(journal, address, Hex.toBigInt(key))
  }
  journal_.warmAddress(journal, sender)
  journal_.warmAddress(journal, to)
  if (Hardfork.atLeast(hardfork, 'cancun'))
    journal_.warmAddress(journal, block.coinbase.toLowerCase())
  for (const address of precompileAddresses(hardfork))
    journal_.warmAddress(journal, address)
  context.authorizationRefund = applyAuthorizations(context)

  let delegatedTo: string | undefined
  if (!create) {
    let code = journal_.getCode(journal, to) ?? new Uint8Array(0)
    delegatedTo = Hardfork.atLeast(hardfork, 'prague')
      ? delegation.getAddress(code)
      : undefined
    if (delegatedTo) {
      const delegate = delegatedTo as Address.Address
      seedAccount(journal, state, delegate)
      const delegatedCode = journal_.getCode(journal, delegate)
      if (delegatedCode === undefined) {
        const seed = resolveSync(state, { address: delegate, kind: 'code' })
        journal_.seed(journal, seed)
        code = journal_.getCode(journal, delegate) as Uint8Array
      } else code = delegatedCode
    }
    const analyzed_ = analyzed(code)
    execution.frame.analysis = analyzed_.analysis
    execution.frame.code = analyzed_.bytes
  }

  const checkpoint = journal_.checkpoint(journal)
  context.transactionCheckpoint = checkpoint
  execution.frame.checkpoint = checkpoint
  if (create) {
    const target = journal_.getAccount(journal, to) as journal_.Account | null
    if (target && target.hasCode === undefined)
      journal_.seed(journal, resolveSync(state, { address: to, kind: 'code' }))
    if (
      target !== null &&
      (target.nonce !== 0n || target.hasCode || target.hasStorage)
    ) {
      halt(execution.machine, execution.frame, 'create-collision')
      return
    }
    journal_.setBalance(
      journal,
      sender,
      (journal_.getAccount(journal, sender)?.balance ?? 0n) - value,
    )
    journal_.setBalance(journal, to, (target?.balance ?? 0n) + value)
    journal_.setNonce(journal, to, 1n)
    journal_.markCreated(journal, to)
    return
  }
  transferValue(execution, { from: sender, state, to, value })
  if (delegatedTo) chargeAccount(execution, delegatedTo)
}

function executeTransaction(context: TransactionContext): Result {
  const execution = context.execution as Execution
  const result = executeRun(execution)
  if (result.status !== 'success')
    journal_.revert(
      execution.machine.journal,
      context.transactionCheckpoint as number,
    )
  return result
}

function settleTransaction(
  context: TransactionContext,
  result: Result,
): Receipt {
  const {
    authorizationRefund,
    effectiveGasPrice,
    evm,
    execution,
    floorGas,
    gasLimit,
    intrinsicGas,
    sender,
  } = context
  const { block, hardfork, state } = evm
  const journal = (execution as Execution).machine.journal
  let gasUsed = intrinsicGas + result.gasUsed
  const refund =
    result.status === 'success'
      ? result.gasRefund + authorizationRefund
      : authorizationRefund
  const refundCap = gasUsed / Hardfork.gas(hardfork).refundQuotient
  gasUsed -= refund < refundCap ? refund : refundCap
  if (gasUsed < floorGas) gasUsed = floorGas

  const senderAccount = journal_.getAccount(journal, sender)
  journal_.setBalance(
    journal,
    sender,
    (senderAccount?.balance ?? 0n) + (gasLimit - gasUsed) * effectiveGasPrice,
  )
  const coinbase = block.coinbase.toLowerCase()
  const coinbaseAccount = journal_.getAccount(journal, coinbase)
  const tip = effectiveGasPrice - block.baseFeePerGas
  if (coinbaseAccount || gasUsed * tip > 0n)
    journal_.setBalance(
      journal,
      coinbase,
      (coinbaseAccount?.balance ?? 0n) + gasUsed * tip,
    )
  commit(journal, state)

  if (result.status === 'success')
    return {
      ...(context.createdAddress
        ? { contractAddress: context.createdAddress }
        : {}),
      effectiveGasPrice,
      gasUsed,
      logs: result.logs,
      output: result.output,
      status: 'success',
    }
  if (result.status === 'reverted')
    return {
      effectiveGasPrice,
      gasUsed,
      output: result.output,
      status: 'reverted',
    }
  return {
    effectiveGasPrice,
    gasUsed,
    reason: result.reason,
    status: 'halted',
  }
}

function transactionSender(envelope: TxEnvelope.TxEnvelope): Address.Address {
  if (envelope.from) return envelope.from.toLowerCase() as Address.Address
  const signature = Signature.extract(envelope)
  if (!signature)
    throw new InvalidTransactionError({ reason: 'missing-sender' })
  if (BigInt(signature.s) > secp256k1N / 2n)
    throw new InvalidTransactionError({ reason: 'signature-s' })
  return Secp256k1.recoverAddress({
    payload: TxEnvelope.getSignPayload(envelope),
    signature,
  }).toLowerCase() as Address.Address
}

function applyAuthorizations(context: TransactionContext): bigint {
  const { authorizationList, evm, execution } = context
  const journal = (execution as Execution).machine.journal
  const gas = Hardfork.gas(evm.hardfork)
  let refund = 0n
  for (const authorization of authorizationList) {
    if (
      authorization.chainId !== 0 &&
      BigInt(authorization.chainId) !== evm.chainId
    )
      continue
    if (authorization.nonce >= (1n << 64n) - 1n) continue
    const signature = Signature.extract(authorization)
    if (!signature || BigInt(signature.s) > secp256k1N / 2n) continue
    let authority: Address.Address
    try {
      authority = Secp256k1.recoverAddress({
        payload: Authorization.getSignPayload(authorization),
        signature,
      }).toLowerCase() as Address.Address
    } catch {
      continue
    }
    journal_.warmAddress(journal, authority)
    seedAccount(journal, evm.state, authority)
    const account = journal_.getAccount(journal, authority)
    if (account && account.hasCode === undefined) {
      journal_.seed(
        journal,
        resolveSync(evm.state, { address: authority, kind: 'code' }),
      )
    }
    const code = journal_.getCode(journal, authority) ?? new Uint8Array(0)
    if (code.length > 0 && !delegation.getAddress(code)) continue
    if ((account?.nonce ?? 0n) !== authorization.nonce) continue
    if (account) refund += gas.authorizationRefund ?? 0n
    journal_.setCode(
      journal,
      authority,
      authorization.address === zeroAddress
        ? new Uint8Array(0)
        : Hex.toBytes(`0xef0100${authorization.address.slice(2)}`),
    )
    journal_.setNonce(journal, authority, authorization.nonce + 1n)
  }
  return refund
}

function precompileAddresses(hardfork: Hardfork.Hardfork): string[] {
  const highest = Hardfork.atLeast(hardfork, 'prague') ? 0x11 : 0x0a
  const addresses = Array.from(
    { length: highest },
    (_, index) => `0x${(index + 1).toString(16).padStart(40, '0')}`,
  )
  if (Hardfork.atLeast(hardfork, 'osaka'))
    addresses.push('0x0000000000000000000000000000000000000100')
  return addresses
}

const secp256k1N =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

function getCode(state: State.Sync, address: Address.Address): Uint8Array {
  const account = state.getAccount(address)
  if (!account) return new Uint8Array(0)
  return Hex.toBytes(account.code ?? state.getCode(address))
}

/**
 * Executes bytecode as a top-level call frame, synchronously.
 *
 * The frame reads and writes journaled state when a `state` source is given —
 * successful runs commit their changes to the source; reverts and halts
 * discard them — and reads empty state otherwise. Message calls and contract
 * creation execute as nested frames.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * // PUSH1 1, PUSH1 2, ADD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
 * const result = Evm.run({
 *   bytecode: '0x60016002015f5260205ff3'
 * })
 * // @log: {
 * // @log:   status: 'success',
 * // @log:   output: '0x0000000000000000000000000000000000000000000000000000000000000003',
 * // @log:   gasUsed: 22n,
 * // @log:   gasRefund: 0n,
 * // @log:   logs: [],
 * // @log: }
 * ```
 *
 * @example
 * ### Journaled state
 *
 * ```ts twoslash
 * import { Evm, State } from 'ox/evm'
 *
 * const address = '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357'
 * const state = State.fromMemory({
 *   accounts: { [address]: { storage: { '0x01': '0x2a' } } }
 * })
 *
 * // PUSH1 1, SLOAD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
 * const result = Evm.run({
 *   address,
 *   bytecode: '0x6001545f5260205ff3',
 *   state
 * })
 * // @log: {
 * // @log:   status: 'success',
 * // @log:   output: '0x000000000000000000000000000000000000000000000000000000000000002a',
 * // @log:   ...
 * // @log: }
 * ```
 *
 * @param options - Options.
 * @returns The execution result.
 */
export function run(options: run.Options): Result {
  const execution = createExecution(options)
  const result = executeRun(execution)
  if (options.state && result.status === 'success')
    commit(execution.machine.journal, options.state)
  return result
}

type Execution = {
  frame: Frame
  gas: bigint
  hardfork: Hardfork.Hardfork
  machine: Machine
  state: State.Sync | undefined
}

function createExecution(
  options: run.Options & {
    createdAddress?: Address.Address | undefined
  },
): Execution {
  const {
    address = zeroAddress,
    blobHashes = [],
    block,
    bytecode,
    caller = zeroAddress,
    chainId = 1n,
    createdAddress,
    data = '0x',
    gas = 30_000_000n,
    gasPrice = 0n,
    hardfork = Hardfork.latest,
    origin = caller,
    state,
    static: static_ = false,
    value = 0n,
  } = options

  const instructions = table(hardfork)
  const { analysis, bytes: code } = analyzed(bytecode)
  const input = typeof data === 'string' ? Hex.toBytes(data) : data

  const journal = journal_.create()
  const frame = createFrame({
    address: address.toLowerCase(),
    analysis,
    caller: addressToWord(caller.toLowerCase()),
    code,
    createdAddress,
    gas,
    input,
    static: static_,
    value,
  })
  const machine: Machine = {
    blobHashes: blobHashes.map((hash) => Hex.toBigInt(hash)),
    block: {
      baseFee: block?.baseFeePerGas ?? 0n,
      blobBaseFee: block?.blobBaseFee ?? 1n,
      chainId,
      coinbase: addressToWord((block?.coinbase ?? zeroAddress).toLowerCase()),
      gasLimit: block?.gasLimit ?? 30_000_000n,
      number: block?.number ?? 0n,
      prevRandao: block?.prevRandao ? Hex.toBigInt(block.prevRandao) : 0n,
      timestamp: block?.timestamp ?? 0n,
    },
    done: false,
    frames: [frame],
    gasPrice,
    halt: undefined,
    journal,
    origin: addressToWord(origin.toLowerCase()),
    request: undefined,
    reverted: false,
    table: instructions,
  }

  // EIP-2929 warm preamble for a bare frame: the executing account, the
  // origin, and the caller. (The transaction layer adds coinbase, target,
  // access lists, and precompiles when it lands.)
  journal_.warmAddress(journal, frame.address)
  journal_.warmAddress(journal, origin.toLowerCase())
  journal_.warmAddress(journal, caller.toLowerCase())

  return { frame, gas, hardfork, machine, state }
}

function executeRun(execution: Execution): Result {
  const { frame, gas, machine, state } = execution
  let request = execute(machine)
  while (request !== undefined) {
    journal_.seed(machine.journal, resolveSync(state, request))
    request = execute(machine)
  }

  if (frame.createdAddress && !machine.halt && !machine.reverted) {
    const code = frame.output ?? new Uint8Array(0)
    const depositGas = BigInt(code.length) * 200n
    if (code.length > Hardfork.gas(execution.hardfork).maxCodeSize)
      halt(machine, frame, 'code-size-exceeded')
    else if (code[0] === 0xef) halt(machine, frame, 'invalid-code')
    else if (depositGas > frame.gas) halt(machine, frame, 'out-of-gas')
    else {
      frame.gas -= depositGas
      journal_.setCode(machine.journal, frame.createdAddress, code)
    }
  }

  const gasUsed = gas - frame.gas
  if (machine.halt) return { gasUsed, reason: machine.halt, status: 'halted' }
  const output = frame.output ? Hex.fromBytes(frame.output) : '0x'
  if (machine.reverted) return { gasUsed, output, status: 'reverted' }

  return {
    gasRefund: machine.journal.refund,
    gasUsed,
    logs: machine.journal.logs.map((log) => ({
      address: Address.checksum(log.address),
      data: Hex.fromBytes(log.data),
      topics: log.topics.map((topic) => Hex.fromNumber(topic, { size: 32 })),
    })),
    output,
    status: 'success',
  }
}

function chargeAccount(execution: Execution, address: string): void {
  const { frame, hardfork, machine } = execution
  const warm = journal_.isWarmAddress(machine.journal, address)
  const gas = Hardfork.gas(hardfork)
  const cost = warm ? gas.warmReadGas : gas.coldAccountAccessGas
  if (cost > frame.gas) {
    halt(machine, frame, 'out-of-gas')
    return
  }
  frame.gas -= cost
  if (!warm) journal_.warmAddress(machine.journal, address)
}

function transferValue(
  execution: Execution,
  options: {
    from: Address.Address
    state: State.Sync
    to: Address.Address
    value: bigint
  },
): void {
  if (options.value === 0n || execution.machine.halt) return
  const journal = execution.machine.journal
  seedAccount(journal, options.state, options.from)
  seedAccount(journal, options.state, options.to)

  const account = journal_.getAccount(journal, options.from)
  const balance = account?.balance ?? 0n
  if (balance < options.value) {
    halt(execution.machine, execution.frame, 'insufficient-balance')
    return
  }

  journal_.setBalance(journal, options.from, balance - options.value)
  const recipient = journal_.getAccount(journal, options.to)
  journal_.setBalance(
    journal,
    options.to,
    (recipient?.balance ?? 0n) + options.value,
  )
}

function seedAccount(
  journal: journal_.Journal,
  state: State.Sync,
  address: Address.Address,
): void {
  if (journal_.getAccount(journal, address) !== undefined) return
  journal_.seed(journal, resolveSync(state, { address, kind: 'account' }))
}

const zeroAddress = '0x0000000000000000000000000000000000000000' as const

// Answers a state request from a synchronous source; absent state reads as
// empty (no accounts, zero storage, zero block hashes).
function resolveSync(
  state: State.Sync | undefined,
  request: journal_.StateRequest,
): journal_.Seed {
  switch (request.kind) {
    case 'account': {
      const account = state?.getAccount(request.address as Address.Address)
      return {
        account: account
          ? {
              balance: account.balance,
              code:
                account.code === undefined
                  ? undefined
                  : Hex.toBytes(account.code),
              hasStorage: account.hasStorage,
              nonce: account.nonce,
            }
          : undefined,
        address: request.address,
        kind: 'account',
      }
    }
    case 'blockHash':
      return {
        hash: state ? Hex.toBigInt(state.getBlockHash(request.number)) : 0n,
        kind: 'blockHash',
        number: request.number,
      }
    case 'code':
      return {
        address: request.address,
        code: state
          ? Hex.toBytes(state.getCode(request.address as Address.Address))
          : new Uint8Array(0),
        kind: 'code',
      }
    case 'storage':
      return {
        address: request.address,
        kind: 'storage',
        slot: request.slot,
        value: state
          ? state.getStorage(request.address as Address.Address, request.slot)
          : 0n,
      }
  }
}

// Applies a successful run's state changes to the source's overlay.
function commit(journal: journal_.Journal, state: State.Sync): void {
  for (const address of journal_.dirtyAccounts(journal)) {
    if (journal.selfdestructs.has(address)) {
      state.putAccount(address as Address.Address, undefined)
      continue
    }
    const account = journal.accounts.get(address)
    if (account === null) continue
    if (account === undefined) continue
    const code = journal.codes.get(address)
    state.putAccount(address as Address.Address, {
      balance: account.balance,
      code: code === undefined ? undefined : Hex.fromBytes(code),
      nonce: account.nonce,
    })
  }
  for (const [address, dirtySlots] of journal_.dirtyStorage(journal)) {
    if (journal.selfdestructs.has(address)) continue
    const slots = journal.storage.get(address)
    if (!slots) continue
    for (const slot of dirtySlots) {
      const value = slots.get(slot)
      if (value === undefined) continue
      state.putStorage(address as Address.Address, slot, value)
    }
  }
}

export declare namespace run {
  type Options = {
    /** Account the code executes as (`ADDRESS`, storage owner). @default zero address */
    address?: Address.Address | undefined
    /** Versioned blob hashes for `BLOBHASH`. */
    blobHashes?: readonly Hex.Hex[] | undefined
    /** Block environment. Omitted fields default to zero-like values. */
    block?: ExactPartial<BlockEnv> | undefined
    /** Bytecode to execute. */
    bytecode: Hex.Hex | Uint8Array
    /** `CALLER`. @default zero address */
    caller?: Address.Address | undefined
    /** `CHAINID`. @default 1n */
    chainId?: bigint | undefined
    /** Calldata. @default '0x' */
    data?: Hex.Hex | Uint8Array | undefined
    /** Gas limit. @default 30_000_000n */
    gas?: bigint | undefined
    /** `GASPRICE`. @default 0n */
    gasPrice?: bigint | undefined
    /** Hardfork whose rules to execute under. @default Hardfork.latest */
    hardfork?: Hardfork.Hardfork | undefined
    /** `ORIGIN`. @default `caller` */
    origin?: Address.Address | undefined
    /** State the frame reads and writes. Successful runs commit their
     * changes to the source; reverts and halts discard them. Absent state
     * reads as empty. */
    state?: State.Sync | undefined
    /** Executes in a static context: `SSTORE`, `TSTORE`, `LOG*`, and
     * `SELFDESTRUCT` halt with `static-violation`. @default false */
    static?: boolean | undefined
    /** `CALLVALUE`. @default 0n */
    value?: bigint | undefined
  }

  type ErrorType =
    | Hardfork.UnknownHardforkError
    | Hex.toBytes.ErrorType
    | Hex.toBigInt.ErrorType
    | Hex.fromBytes.ErrorType
    | Hex.fromNumber.ErrorType
    | Address.checksum.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Narrows a {@link ox#Evm.(Result:type)} to its success variant, throwing
 * for the others.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * const result = Evm.run({
 *   bytecode: '0x60016002015f5260205ff3'
 * })
 * Evm.assertSuccess(result)
 * result.output
 * //     ^?
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * // PUSH0, PUSH0, REVERT
 * const result = Evm.run({ bytecode: '0x5f5ffd' })
 * Evm.assertSuccess(result)
 * // @error: Evm.RevertedError: Execution reverted.
 * ```
 *
 * @param result - Result to narrow.
 */
export function assertSuccess(
  result: Result,
): asserts result is Extract<Result, { status: 'success' }> {
  if (result.status === 'reverted')
    throw new RevertedError({ data: result.output })
  if (result.status === 'halted')
    throw new HaltedError({ reason: result.reason })
}

export declare namespace assertSuccess {
  type ErrorType = RevertedError | HaltedError | Errors.GlobalErrorType
}

/** Thrown when execution ends in `REVERT`. */
export class RevertedError extends Errors.BaseError {
  override readonly name = 'Evm.RevertedError'

  /** Revert data. */
  readonly data: Hex.Hex

  constructor({ data }: { data: Hex.Hex }) {
    // Pass `metaMessages` only when there is data: `BaseError` treats any
    // array as present and would emit a trailing blank line for `[undefined]`.
    super(
      'Execution reverted.',
      data !== '0x' ? { metaMessages: [`Data: ${data}`] } : {},
    )
    this.data = data
  }
}

/** Thrown when execution halts exceptionally — out of gas, a stack violation,
 * an undefined opcode, or a jump to a non-`JUMPDEST`. */
export class HaltedError extends Errors.BaseError {
  override readonly name = 'Evm.HaltedError'

  /** The halting reason. */
  readonly reason: HaltReason

  constructor({ reason }: { reason: HaltReason }) {
    super(`Execution halted: ${reason}.`)
    this.reason = reason
  }
}

/** Thrown when a transaction cannot be included. */
export class InvalidTransactionError extends Errors.BaseError {
  override readonly name = 'Evm.InvalidTransactionError'

  /** Machine-readable validity reason. */
  readonly reason: string

  constructor({ reason }: { reason: string }) {
    super(`Transaction is invalid: ${reason}.`)
    this.reason = reason
  }
}

/** Thrown when no configured handler accepts a transaction type. */
export class UnsupportedTransactionTypeError extends Errors.BaseError {
  override readonly name = 'Evm.UnsupportedTransactionTypeError'

  constructor({ type }: { type: string }) {
    super(`Transaction type \`${type}\` is not supported.`)
  }
}
