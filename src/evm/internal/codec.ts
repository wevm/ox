import type * as Address from '../../core/Address.js'
import * as Bytes from '../../core/Bytes.js'
import * as Errors from '../../core/Errors.js'
import * as Hex from '../../core/Hex.js'

/**
 * ABI v1 codec for the evm2 WASM adapter.
 *
 * The layouts here are the other half of `wasm/evm2/src/abi.rs`: fixed-width
 * little-endian integers, 256-bit values as 32 big-endian bytes, addresses as
 * 20, hashes as 32, and byte sequences behind a `u32` length.
 *
 * @internal
 */

/** Magic bytes prefixing every header: `EVM2` read little-endian. */
export const magic = 0x32_4d_56_45

/** ABI version. Ox's compatibility boundary over evm2's Rust API. */
export const version = 1

/** Request and response header size, in bytes. */
export const headerSize = 16

/**
 * Largest request the adapter accepts, in bytes.
 *
 * Mirrors `MAX_REQUEST` in `wasm/evm2/src/abi.rs`. Consensus sets no usable
 * ceiling, so this is an adapter bound; the two halves must move together.
 */
export const maxRequest = 64 * 1024 * 1024

/** Adapter operations. */
export const op = {
  create: 1,
  destroy: 2,
  setBlock: 3,
  callTx: 4,
  readAccount: 5,
  transact: 6,
  commit: 7,
  discard: 8,
  detach: 9,
  commitWith: 10,
  discardWith: 11,
} as const

/**
 * evm2 `SpecId` discriminants, in its declaration order.
 *
 * The wire value is the discriminant, so this list must track evm2's enum. A
 * value past the last one is rejected by the adapter rather than silently
 * reinterpreted.
 */
export const specId = {
  frontier: 0,
  homestead: 1,
  tangerine: 2,
  spuriousDragon: 3,
  byzantium: 4,
  petersburg: 5,
  istanbul: 6,
  berlin: 7,
  london: 8,
  merge: 9,
  shanghai: 10,
  cancun: 11,
  prague: 12,
  osaka: 13,
  amsterdam: 14,
} as const

/** Response statuses. */
export const status = {
  ok: 0,
  abi: 1,
  engineMissing: 2,
  engineBusy: 3,
  handler: 4,
  database: 5,
  engineBorrowed: 6,
  notExecuted: 7,
  sink: 8,
  pending: 9,
} as const

/** Block environment, in evm2's `BlockEnvExt` terms. */
export type Block = {
  /** Block base fee. */
  basefee: bigint
  /** Block beneficiary. */
  beneficiary: Address.Address
  /** Blob base fee. */
  blobBasefee: bigint
  /** Pre-merge block difficulty. */
  difficulty: bigint
  /** Block gas limit. */
  gasLimit: bigint
  /** Block number. */
  number: bigint
  /** Post-merge randomness value. */
  prevrandao: bigint
  /** Beacon slot number. */
  slotNum: bigint
  /** Block timestamp. */
  timestamp: bigint
}

/** A log emitted by a transaction. */
export type Log = {
  /** Emitting account. */
  address: Address.Address
  /** Log data. */
  data: Hex.Hex
  /** Indexed topics. */
  topics: readonly Hex.Hex[]
}

/** Transaction result, preserving evm2's `TxResult` fields. */
export type TxResult = {
  /** Created contract address for successful create transactions. */
  createdAddress?: Address.Address | undefined
  /** Host error code raised during execution, if any. */
  errorCode?: bigint | undefined
  /** EIP-7623 floor gas. Zero when not applicable. */
  floorGas: bigint
  /** Logs emitted by the transaction. */
  logs: readonly Log[]
  /** Return or revert output. */
  output: Hex.Hex
  /** Gas refund, capped per EIP-3529, before the EIP-7623 floor adjustment. */
  refunded: bigint
  /** State gas consumed by the transaction per EIP-8037. */
  stateGasSpent: bigint
  /** Whether execution succeeded. */
  status: boolean
  /** Interpreter stop reason, as evm2's `InstrStop` discriminant. */
  stop: number
  /** Total gas spent, regular plus state, before refund. */
  totalGasSpent: bigint
}

/** A handler failure, as evm2 reported it. */
export type Handler = {
  /** Variant discriminant, matching `wasm/evm2/src/error.rs`. */
  kind: number
  /** evm2's own message for the failure. */
  message: string
  /** The variant's numeric fields, in declaration order. */
  words: readonly bigint[]
}

/** Builds a request payload. */
class Writer {
  #bytes: number[] = []

  bytes(value: Bytes.Bytes) {
    this.u32(value.length)
    for (const byte of value) this.#bytes.push(byte)
  }

  // Every fixed-width writer rejects out-of-range input. Truncating instead
  // would silently change which fork or chain the engine runs.
  u32(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 0xff_ff_ff_ff)
      throw new EncodeError({ max: '4294967295', value: String(value) })
    this.#bytes.push(
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      value >>> 24,
    )
  }

  u64(value: bigint) {
    if (value < 0n || value > 0xff_ff_ff_ff_ff_ff_ff_ffn)
      throw new EncodeError({
        max: '18446744073709551615',
        value: String(value),
      })
    for (let index = 0; index < 8; index++)
      this.#bytes.push(Number((value >> BigInt(index * 8)) & 0xffn))
  }

  word(value: bigint) {
    if (value < 0n || value >> 256n !== 0n)
      throw new EncodeError({ max: '2^256 - 1', value: String(value) })
    this.bare(Bytes.fromNumber(value, { size: 32 }))
  }

  address(value: Address.Address) {
    const bytes = Bytes.fromHex(value)
    if (bytes.length !== 20)
      throw new EncodeError({ max: '20 bytes', value: `${bytes.length} bytes` })
    this.bare(bytes)
  }

  bare(value: Bytes.Bytes) {
    for (const byte of value) this.#bytes.push(byte)
  }

  /** Prefixes the header for `operation` and returns the request. */
  finish(operation: number): Bytes.Bytes {
    const request = new Uint8Array(headerSize + this.#bytes.length)
    const view = new DataView(request.buffer)
    view.setUint32(0, magic, true)
    view.setUint16(4, version, true)
    view.setUint16(6, operation, true)
    view.setUint32(8, 0, true)
    view.setUint32(12, this.#bytes.length, true)
    request.set(this.#bytes, headerSize)
    return request
  }
}

/** Reads a response payload. */
class Reader {
  #at = 0
  #bytes: Bytes.Bytes

  constructor(bytes: Bytes.Bytes) {
    this.#bytes = bytes
  }

  #take(length: number) {
    const end = this.#at + length
    if (end > this.#bytes.length)
      throw new DecodeError(
        `response ended after ${this.#bytes.length} bytes, needed ${end}`,
      )
    const slice = this.#bytes.subarray(this.#at, end)
    this.#at = end
    return slice
  }

  u8() {
    return this.#take(1)[0]!
  }

  bool() {
    const value = this.u8()
    if (value > 1)
      throw new DecodeError(`expected a boolean byte, got ${value}`)
    return value === 1
  }

  u16() {
    const bytes = this.#take(2)
    return bytes[0]! | (bytes[1]! << 8)
  }

  u32() {
    const bytes = this.#take(4)
    return (
      bytes[0]! +
      bytes[1]! * 0x100 +
      bytes[2]! * 0x10000 +
      bytes[3]! * 0x1000000
    )
  }

  u64() {
    const bytes = this.#take(8)
    let value = 0n
    for (let index = 7; index >= 0; index--)
      value = (value << 8n) | BigInt(bytes[index]!)
    return value
  }

  word() {
    return Bytes.toBigInt(this.#take(32))
  }

  address() {
    return Hex.fromBytes(this.#take(20)) as Address.Address
  }

  hash() {
    return Hex.fromBytes(this.#take(32))
  }

  bytes() {
    return this.#take(this.u32())
  }

  string() {
    return new TextDecoder().decode(this.bytes())
  }

  /** Asserts the payload was consumed exactly. */
  finish() {
    if (this.#at !== this.#bytes.length)
      throw new DecodeError(
        `response had ${this.#bytes.length - this.#at} trailing bytes`,
      )
  }
}

/** Encodes an engine creation request. */
export function encodeCreate(options: encodeCreate.Options): Bytes.Bytes {
  return config(options).finish(op.create)
}

export declare namespace encodeCreate {
  type Options = {
    /** Block environment. */
    block: Block
    /** Chain id the `CHAINID` opcode reports and transactions validate against. */
    chainId: bigint
    /** Overrides applied on top of the specification's own version. */
    version?: Version | undefined
    /** evm2 `SpecId` discriminant. */
    specId: number
  }
}

/** Encodes a request replacing the block environment and specification. */
export function encodeSetBlock(options: encodeCreate.Options): Bytes.Bytes {
  return config(options).finish(op.setBlock)
}

/** Encodes a request dropping the engine. */
export function encodeDestroy(): Bytes.Bytes {
  return new Writer().finish(op.destroy)
}

/** Encodes an account read. */
export function encodeReadAccount(address: Address.Address): Bytes.Bytes {
  const writer = new Writer()
  writer.address(address)
  return writer.finish(op.readAccount)
}

/** Decodes an account read response, or `undefined` when it does not exist. */
export function decodeAccount(payload: Bytes.Bytes): Account | undefined {
  const reader = new Reader(payload)
  if (!reader.bool()) {
    reader.finish()
    return undefined
  }
  const balance = reader.word()
  const nonce = reader.u64()
  const codeHash = reader.hash()
  const code = reader.bytes()
  reader.finish()
  return {
    balance,
    ...(code.length > 0 ? { code } : {}),
    codeHash,
    nonce,
  }
}

/** An account, as the engine reports it. */
export type Account = {
  balance: bigint
  code?: Bytes.Bytes | undefined
  codeHash: Hex.Hex
  nonce: bigint
}

/** Encodes a result-only transaction execution request. */
export function encodeCallTx(options: encodeCallTx.Options): Bytes.Bytes {
  const writer = new Writer()
  writer.address(options.signer)
  writer.bytes(options.envelope)
  return writer.finish(op.callTx)
}

export declare namespace encodeCallTx {
  type Options = {
    /** EIP-2718 encoded transaction envelope. */
    envelope: Bytes.Bytes
    /** Recovered sender. evm2 takes the signer rather than re-deriving it. */
    signer: Address.Address
  }
}

/** Encodes a transaction execution that leaves its state changes pending. */
export function encodeTransact(options: encodeCallTx.Options): Bytes.Bytes {
  const writer = new Writer()
  writer.address(options.signer)
  writer.bytes(options.envelope)
  return writer.finish(op.transact)
}

/** Encodes a resolution of the outstanding executed transaction. */
export function encodeResolve(
  resolution: 'commit' | 'commitWith' | 'detach' | 'discard' | 'discardWith',
): Bytes.Bytes {
  return new Writer().finish(op[resolution])
}

/** Record tags in a serialized state-change stream. */
export const record = {
  end: 0,
  bytecode: 1,
  account: 2,
  storageWipe: 3,
  storage: 4,
  accountRead: 5,
  storageRead: 6,
} as const

/**
 * Decodes a state-change stream.
 *
 * evm2 keeps `PendingState`'s fields crate-private, so the adapter sends the
 * stream its `StateChangeSource::visit` produces. For a detached pending state
 * that order is deterministic.
 */
export function decodeChanges(payload: Bytes.Bytes): Changes {
  const reader = new Reader(payload)
  const changes: Mutable = {
    accountReads: [],
    accounts: [],
    bytecode: [],
    records: [],
    storage: [],
    storageReads: [],
    storageWipes: [],
  }
  while (true) {
    const record = readRecord(reader)
    if (!record) break
    changes.records.push(record)
    collect(changes, record)
  }
  reader.finish()
  return changes
}

/** A change stream being built. @internal */
type Mutable = {
  accountReads: AccountChange[]
  accounts: AccountChange[]
  bytecode: { code: Bytes.Bytes; codeHash: Hex.Hex }[]
  records: Change[]
  storage: StorageChange[]
  storageReads: StorageChange[]
  storageWipes: Address.Address[]
}

/** Files one record into the stream it belongs to. */
function collect(changes: Mutable, record: Change) {
  // `kind` routes a streamed record; the grouped arrays do not repeat it.
  if (record.kind === 'bytecode')
    changes.bytecode.push({ code: record.code, codeHash: record.codeHash })
  else if (record.kind === 'account')
    changes.accounts.push({
      address: record.address,
      created: record.created,
      current: record.current,
      original: record.original,
      selfdestructed: record.selfdestructed,
    })
  else if (record.kind === 'accountRead')
    changes.accountReads.push({
      address: record.address,
      current: record.current,
    })
  else if (record.kind === 'storage')
    changes.storage.push({
      address: record.address,
      current: record.current,
      key: record.key,
      original: record.original,
    })
  else if (record.kind === 'storageRead')
    changes.storageReads.push({
      address: record.address,
      current: record.current,
      key: record.key,
    })
  else changes.storageWipes.push(record.address)
}

/**
 * Reads one record, or `undefined` at the end of the stream.
 *
 * Every field is read into a local before the object is built: these are
 * sequential reads, so an object literal would make its field order the wire
 * order.
 *
 * @internal
 */
function readRecord(reader: Reader): Change | undefined {
  const tag = reader.u8()
  if (tag === record.end) return undefined

  const info = (): ChangeAccount | undefined => {
    if (!reader.bool()) return undefined
    const balance = reader.word()
    const nonce = reader.u64()
    const codeHash = reader.hash()
    return { balance, codeHash, nonce }
  }

  if (tag === record.bytecode) {
    const codeHash = reader.hash()
    const code = reader.bytes()
    return { code, codeHash, kind: 'bytecode' }
  }
  if (tag === record.account) {
    const address = reader.address()
    const original = info()
    const current = info()
    const created = reader.bool()
    const selfdestructed = reader.bool()
    return {
      address,
      created,
      current,
      kind: 'account',
      original,
      selfdestructed,
    }
  }
  if (tag === record.storageWipe)
    return { address: reader.address(), kind: 'storageWipe' }
  if (tag === record.storage) {
    const address = reader.address()
    const key = reader.word()
    const original = reader.word()
    const current = reader.word()
    return { address, current, key, kind: 'storage', original }
  }
  if (tag === record.accountRead) {
    const address = reader.address()
    const current = info()
    return { address, current, kind: 'accountRead' }
  }
  if (tag === record.storageRead) {
    const address = reader.address()
    const key = reader.word()
    const current = reader.word()
    return { address, current, key, kind: 'storageRead' }
  }
  throw new DecodeError(`unknown change record ${tag}`)
}

/** Decodes a single record the adapter streamed to a sink. */
export function decodeRecord(payload: Bytes.Bytes): Change {
  const reader = new Reader(payload)
  const decoded = readRecord(reader)
  if (!decoded) throw new DecodeError('empty change record')
  reader.finish()
  return decoded
}

/** One record from a change stream, tagged by what it describes. */
export type Change =
  | (AccountChange & { kind: 'account' | 'accountRead' })
  | (StorageChange & { kind: 'storage' | 'storageRead' })
  | { address: Address.Address; kind: 'storageWipe' }
  | { code: Bytes.Bytes; codeHash: Hex.Hex; kind: 'bytecode' }

/**
 * An account as a change stream reports it.
 *
 * Carries the code hash only; the code itself arrives once, keyed by that hash,
 * under the stream's `bytecode` records.
 */
export type ChangeAccount = {
  balance: bigint
  codeHash: Hex.Hex
  nonce: bigint
}

/** An account the transaction loaded, changed or not. */
export type AccountChange = {
  address: Address.Address
  created?: boolean | undefined
  /** Value after the change. Absent means the account does not exist. */
  current?: ChangeAccount | undefined
  /** Value at the transaction boundary. */
  original?: ChangeAccount | undefined
  selfdestructed?: boolean | undefined
}

/** A storage slot the transaction loaded, changed or not. */
export type StorageChange = {
  address: Address.Address
  current: bigint
  key: bigint
  /** Value at the transaction boundary. Absent on a read. */
  original?: bigint | undefined
}

/**
 * A decoded state-change stream.
 *
 * `records` preserves the adapter's emission order, which is evm2's own visit
 * order; the grouped views serve keyed lookups.
 */
export type Changes = {
  accountReads: readonly AccountChange[]
  accounts: readonly AccountChange[]
  bytecode: readonly { code: Bytes.Bytes; codeHash: Hex.Hex }[]
  records: readonly Change[]
  storage: readonly StorageChange[]
  storageReads: readonly StorageChange[]
  storageWipes: readonly Address.Address[]
}

/** Decodes a `TxResult` response payload. */
export function decodeResult(payload: Bytes.Bytes): TxResult {
  const reader = new Reader(payload)
  // Locals first: these are sequential reads, so an object literal's property
  // order would be the wire order.
  const status = reader.bool()
  const stop = reader.u8()
  const totalGasSpent = reader.u64()
  const stateGasSpent = reader.u64()
  const refunded = reader.u64()
  const floorGas = reader.u64()
  const result = {
    floorGas,
    refunded,
    stateGasSpent,
    status,
    stop,
    totalGasSpent,
  }
  const createdAddress = reader.bool() ? reader.address() : undefined
  const errorCode = reader.bool() ? reader.u64() : undefined
  const output = Hex.fromBytes(reader.bytes())

  const logs: Log[] = []
  for (let index = reader.u32(); index > 0; index--) {
    const address = reader.address()
    const topics: Hex.Hex[] = []
    for (let topic = reader.u32(); topic > 0; topic--)
      topics.push(reader.hash())
    logs.push({ address, data: Hex.fromBytes(reader.bytes()), topics })
  }
  reader.finish()

  return { ...result, createdAddress, errorCode, logs, output }
}

/** Decodes a handler-failure response payload. */
export function decodeHandler(payload: Bytes.Bytes): Handler {
  const reader = new Reader(payload)
  const kind = reader.u16()
  const words: bigint[] = []
  for (let index = reader.u8(); index > 0; index--) words.push(reader.word())
  const message = reader.string()
  reader.finish()
  return { kind, message, words }
}

/** Decodes a response payload carrying only a message. */
export function decodeMessage(payload: Bytes.Bytes): string {
  const reader = new Reader(payload)
  const message = reader.string()
  reader.finish()
  return message
}

function config(options: encodeCreate.Options) {
  const { block } = options
  const writer = new Writer()
  writer.u32(options.specId)
  writer.u64(options.chainId)
  // Wire order follows evm2's `BlockEnvExt` declaration order.
  writer.word(block.number)
  writer.address(block.beneficiary)
  writer.word(block.timestamp)
  writer.word(block.gasLimit)
  writer.word(block.basefee)
  writer.word(block.difficulty)
  writer.word(block.prevrandao)
  writer.word(block.blobBasefee)
  writer.word(block.slotNum)
  overrides(writer, options.version)
  return writer
}

/** Scalar version fields, paired with the presence bit the ABI gives each. */
export const fields = {
  txGasLimitCap: 1 << 0,
  memoryLimit: 1 << 1,
  maxCodeSize: 1 << 2,
  maxInitcodeSize: 1 << 3,
  maxBlobsPerTx: 1 << 4,
  blobBaseFeeUpdateFraction: 1 << 5,
} as const

/**
 * evm2's feature flags, in its declaration order.
 *
 * The index is the wire value, so this list tracks
 * `wasm/evm2/src/features.rs`. A flag absent here cannot be addressed.
 */
export const features = [
  'txChainIdCheck',
  'nonceCheck',
  'balanceCheck',
  'balanceTopUp',
  'blockGasLimitCheck',
  'eip3607',
  'priorityFeeCheck',
  'feeCharge',
  'eip2',
  'eip150',
  'eip161',
  'codeSizeCheck',
  'eip2028',
  'eip2200',
  'eip2929',
  'eip3529',
  'eip3541',
  'baseFeeCheck',
  'eip4399',
  'eip3651',
  'eip3860',
  'eip6780',
  'eip7623',
  'eip7702',
  'eip8037',
  'eip7708',
  'eip8246',
  'eip2780',
] as const

/**
 * evm2's gas parameters, in `GasId` declaration order.
 *
 * The index is the wire value, matching evm2's own discriminant.
 */
export const gasIds = [
  'expByte',
  'extcodecopyPerWord',
  'copyPerWord',
  'logdata',
  'logtopic',
  'mcopyPerWord',
  'keccak256PerWord',
  'memoryLinearCost',
  'memoryQuadraticReduction',
  'initcodePerWord',
  'create',
  'callStipendReduction',
  'transferValueCost',
  'coldAccountAdditionalCost',
  'newAccountCost',
  'warmStorageReadCost',
  'sstoreStatic',
  'sstoreSetWithoutLoadCost',
  'sstoreResetWithoutColdLoadCost',
  'sstoreClearingSlotRefund',
  'selfdestructRefund',
  'callStipend',
  'maxRefundQuotient',
  'coldStorageAdditionalCost',
  'coldStorageCost',
  'newAccountCostForSelfdestruct',
  'codeDepositCost',
  'txEip7702PerEmptyAccountCost',
  'txTokenNonZeroByteMultiplier',
  'txTokenCost',
  'txFloorCostPerToken',
  'txFloorCostBase',
  'txFloorZeroByteMultiplier',
  'txAccessListAddressCost',
  'txAccessListStorageKeyCost',
  'txAccessListFloorByteMultiplier',
  'txBaseStipend',
  'txCreateCost',
  'txInitcodeCost',
  'sstoreSetRefund',
  'sstoreResetRefund',
  'txEip7702AuthRefund',
  'sstoreSetState',
  'newAccountState',
  'codeDepositState',
  'createState',
  'txEip7702PerAuthState',
  'txTransferLogCost',
  'txValueCost',
  'txCreateAccessCost',
  'custom0',
  'custom1',
  'custom2',
  'custom3',
  'custom4',
  'custom5',
  'custom6',
  'custom7',
] as const

/**
 * Writes the caller's version overrides.
 *
 * Every group is partial: what the caller does not mention keeps the value the
 * specification gave it, so evm2 stays the source of each default.
 */
function overrides(writer: Writer, version: Version | undefined) {
  let present = 0
  for (const [name, bit] of Object.entries(fields))
    if (version?.[name as keyof typeof fields] !== undefined) present |= bit
  writer.u32(present)

  for (const name of Object.keys(fields) as (keyof typeof fields)[]) {
    const value = version?.[name]
    if (value !== undefined) writer.u64(value)
  }

  const flags = Object.entries(version?.features ?? {}).filter(
    ([, on]) => on !== undefined,
  )
  writer.u32(flags.length)
  for (const [name, on] of flags) {
    const index = features.indexOf(name as (typeof features)[number])
    if (index < 0) throw new UnknownFeatureError({ name })
    writer.u32(index)
    writer.u32(on ? 1 : 0)
  }

  const gas = Object.entries(version?.gas ?? {}).filter(
    ([, cost]) => cost !== undefined,
  )
  writer.u32(gas.length)
  for (const [name, cost] of gas) {
    const index = gasIds.indexOf(name as (typeof gasIds)[number])
    if (index < 0) throw new UnknownGasIdError({ name })
    writer.u32(index)
    writer.u32(cost as number)
  }
}

/** Version overrides applied on top of a specification's own values. */
export type Version = {
  /** Blob base fee update fraction. */
  blobBaseFeeUpdateFraction?: bigint | undefined
  /** Feature flags to turn on or off. */
  features?: Partial<Record<(typeof features)[number], boolean>> | undefined
  /** Gas parameters to replace. */
  gas?: Partial<Record<(typeof gasIds)[number], number>> | undefined
  /** Blobs allowed in one transaction. */
  maxBlobsPerTx?: bigint | undefined
  /** Largest deployable bytecode. */
  maxCodeSize?: bigint | undefined
  /** Largest creation initcode. */
  maxInitcodeSize?: bigint | undefined
  /** Hard memory limit, in bytes. */
  memoryLimit?: bigint | undefined
  /** Transaction gas limit cap. */
  txGasLimitCap?: bigint | undefined
}

/** Thrown when a feature name is not one evm2 declares. */
export class UnknownFeatureError extends Errors.BaseError {
  override readonly name = 'Evm.UnknownFeatureError'

  constructor({ name }: { name: string }) {
    super(`\`${name}\` is not a feature this version knows.`)
  }
}

/** Thrown when a gas parameter name is not one evm2 declares. */
export class UnknownGasIdError extends Errors.BaseError {
  override readonly name = 'Evm.UnknownGasIdError'

  constructor({ name }: { name: string }) {
    super(`\`${name}\` is not a gas parameter this version knows.`)
  }
}

/** Thrown when a value does not fit the wire width the ABI declares. */
export class EncodeError extends Errors.BaseError {
  override readonly name = 'Evm.EncodeError'

  constructor({ max, value }: { max: string; value: string }) {
    super('A value does not fit the width this ABI encodes it at.', {
      metaMessages: [`Value:   ${value}`, `Maximum: ${max}`],
    })
  }
}

/** Thrown when a response does not match the ABI the codec expects. */
export class DecodeError extends Errors.BaseError {
  override readonly name = 'Evm.DecodeError'

  constructor(reason: string) {
    super(
      'The evm2 adapter returned a response this ABI version cannot read.',
      {
        metaMessages: [reason, `Expected ABI version ${version}.`],
      },
    )
  }
}
