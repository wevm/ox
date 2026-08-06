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
  setInspector: 12,
  setBal: 13,
  setBalBuilder: 14,
  takeBal: 15,
  setBalIndex: 16,
  commitTo: 17,
  startBlockState: 18,
  takeBlockState: 19,
  warmPrecompiles: 20,
  commitSource: 21,
  systemCall: 22,
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
  balNotCovered: 10,
  noBlockState: 11,
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
  /** Recorded execution, when an inspector was installed. */
  trace?: Trace | undefined
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
  // A growable byte buffer rather than a number array: an envelope near the
  // request ceiling would otherwise cost element storage and growth for every
  // byte before `finish` allocates the payload as well.
  #bytes = new Uint8Array(256)
  #length = 0

  #reserve(count: number) {
    if (this.#length + count <= this.#bytes.length) return
    let capacity = this.#bytes.length * 2
    while (capacity < this.#length + count) capacity *= 2
    const grown = new Uint8Array(capacity)
    grown.set(this.#bytes.subarray(0, this.#length))
    this.#bytes = grown
  }

  #push(...values: readonly number[]) {
    this.#reserve(values.length)
    for (const value of values) this.#bytes[this.#length++] = value
  }

  bytes(value: Bytes.Bytes) {
    this.u32(value.length)
    this.#reserve(value.length)
    this.#bytes.set(value, this.#length)
    this.#length += value.length
  }

  u8(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 0xff)
      throw new EncodeError({ max: '255', value: String(value) })
    this.#push(value)
  }

  bool(value: boolean) {
    this.#push(value ? 1 : 0)
  }

  hash(value: Hex.Hex) {
    const bytes = Bytes.fromHex(value)
    if (bytes.length !== 32)
      throw new EncodeError({ max: '32 bytes', value: `${bytes.length} bytes` })
    this.bare(bytes)
  }

  // Every fixed-width writer rejects out-of-range input. Truncating instead
  // would silently change which fork or chain the engine runs.
  u32(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 0xff_ff_ff_ff)
      throw new EncodeError({ max: '4294967295', value: String(value) })
    this.#push(
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
      this.#push(Number((value >> BigInt(index * 8)) & 0xffn))
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
    this.#reserve(value.length)
    this.#bytes.set(value, this.#length)
    this.#length += value.length
  }

  /** Prefixes the header for `operation` and returns the request. */
  finish(operation: number): Bytes.Bytes {
    const request = new Uint8Array(headerSize + this.#length)
    const view = new DataView(request.buffer)
    view.setUint32(0, magic, true)
    view.setUint16(4, version, true)
    view.setUint16(6, operation, true)
    view.setUint32(8, 0, true)
    view.setUint32(12, this.#length, true)
    request.set(this.#bytes.subarray(0, this.#length), headerSize)
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

/**
 * State a block's transactions changed, gathered across all of them.
 *
 * Each entry spans the block rather than a transaction: `original` is the value
 * before the block, `current` the value after its last transaction touched it.
 * Every collection enumerates deterministically.
 */
export type BlockState = {
  /** Accounts the block touched, sorted by address. */
  accounts: readonly {
    address: Address.Address
    /** Value after the block. Absent means the account does not exist. */
    current?: ChangeAccount | undefined
    /** Value before the block. Absent means it did not exist. */
    original?: ChangeAccount | undefined
  }[]
  /** Code the block deployed, sorted by hash. */
  code: readonly { code: Bytes.Bytes; codeHash: Hex.Hex }[]
  /** Slots the block changed, sorted by account then slot. */
  storage: readonly {
    address: Address.Address
    current: bigint
    key: bigint
    original: bigint
  }[]
  /** Accounts whose storage the block cleared, sorted by address. */
  storageWipes: readonly Address.Address[]
}

/** Encodes a system call. */
export function encodeSystemCall(
  options: encodeSystemCall.Options,
): Bytes.Bytes {
  const writer = new Writer()
  writer.address(options.caller)
  writer.address(options.address)
  writer.bytes(options.data)
  return writer.finish(op.systemCall)
}

export declare namespace encodeSystemCall {
  type Options = {
    /** Target system contract. */
    address: Address.Address
    /** Account the call originates from. */
    caller: Address.Address
    /** Calldata. */
    data: Bytes.Bytes
  }
}

/**
 * Encodes a request applying changes to the accepted state overlay.
 *
 * Only changes are written. A read has the same original and current value, which
 * is not a change, so applying one is a no-op; emitting it would only risk
 * overwriting a real change for the same key, since the adapter rebuilds a map.
 * Bytecode travels with it, or an account applied to another EVM would carry a
 * hash for bytes that EVM never saw.
 */
export function encodeCommitSource(changes: Changes): Bytes.Bytes {
  const writer = new Writer()

  for (const change of changes.accounts) {
    writer.u8(record.account)
    writer.address(change.address)
    writeChangeAccount(writer, change.original)
    writeChangeAccount(writer, change.current)
    writer.bool(change.created ?? false)
    writer.bool(change.selfdestructed ?? false)
  }
  for (const change of changes.storage) {
    writer.u8(record.storage)
    writer.address(change.address)
    writer.word(change.key)
    writer.word(change.original ?? change.current)
    writer.word(change.current)
  }
  for (const address of changes.storageWipes) {
    writer.u8(record.storageWipe)
    writer.address(address)
  }

  for (const entry of changes.bytecode) {
    writer.u8(record.bytecode)
    writer.hash(entry.codeHash)
    writer.bytes(entry.code)
  }

  writer.u8(record.end)
  return writer.finish(op.commitSource)
}

/** Writes an account's fields, or a flag saying it is absent. */
function writeChangeAccount(
  writer: Writer,
  value: ChangeAccount | undefined,
): void {
  if (!value) {
    writer.bool(false)
    return
  }
  writer.bool(true)
  writer.word(value.balance)
  writer.u64(value.nonce)
  writer.hash(value.codeHash)
}

/** Encodes a request starting a block accumulator. */
export function encodeStartBlockState(): Bytes.Bytes {
  return new Writer().finish(op.startBlockState)
}

/** Encodes a request draining the block state a token identifies. */
export function encodeTakeBlockState(token: bigint): Bytes.Bytes {
  const writer = new Writer()
  writer.u64(token)
  return writer.finish(op.takeBlockState)
}

/** Encodes a resolution recording into the block accumulator a token identifies. */
export function encodeCommitTo(token: bigint): Bytes.Bytes {
  const writer = new Writer()
  writer.u64(token)
  return writer.finish(op.commitTo)
}

/** Decodes a started accumulator's token. */
export function decodeBlockToken(bytes: Bytes.Bytes): bigint {
  const reader = new Reader(bytes)
  const token = reader.u64()
  reader.finish()
  return token
}

/** Encodes a request prewarming the precompile addresses. */
export function encodeWarmPrecompiles(): Bytes.Bytes {
  return new Writer().finish(op.warmPrecompiles)
}

/**
 * Decodes accumulated block state.
 *
 * Fields go into locals before each object is built: these are sequential reads,
 * so an object literal's property order would be the wire order.
 */
export function decodeBlockState(bytes: Bytes.Bytes): BlockState {
  const reader = new Reader(bytes)

  const accounts: BlockState['accounts'][number][] = []
  for (let count = reader.u32(); count > 0; count--) {
    const address = reader.address()
    const original = readChangeAccount(reader)
    const current = readChangeAccount(reader)
    accounts.push({
      address,
      ...(current ? { current } : {}),
      ...(original ? { original } : {}),
    })
  }

  const storageWipes: Address.Address[] = []
  for (let count = reader.u32(); count > 0; count--)
    storageWipes.push(reader.address())

  const storage: BlockState['storage'][number][] = []
  for (let count = reader.u32(); count > 0; count--) {
    const address = reader.address()
    const key = reader.word()
    const original = reader.word()
    const current = reader.word()
    storage.push({ address, current, key, original })
  }

  const code: BlockState['code'][number][] = []
  for (let count = reader.u32(); count > 0; count--) {
    const codeHash = reader.hash()
    const value = reader.bytes()
    code.push({ code: value, codeHash })
  }

  reader.finish()
  return { accounts, code, storage, storageWipes }
}

/** Reads an account's fields, or nothing when the flag says it is absent. */
function readChangeAccount(reader: Reader): ChangeAccount | undefined {
  if (!reader.bool()) return undefined
  const balance = reader.word()
  const nonce = reader.u64()
  const codeHash = reader.hash()
  return { balance, codeHash, nonce }
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

/** Event tags in a serialized trace stream. */
export const events = {
  end: 0,
  initialize: 1,
  step: 2,
  stepEnd: 3,
  log: 4,
  call: 5,
  callEnd: 6,
  create: 7,
  createEnd: 8,
  selfdestruct: 9,
} as const

/** Message kinds, as the ABI numbers them. */
export const messageKinds = [
  'call',
  'delegateCall',
  'callCode',
  'create',
  'create2',
  'staticCall',
] as const

/**
 * Reported for a kind this ABI version does not name.
 *
 * evm2's `MessageKind` is `#[non_exhaustive]`, so a later revision can add one.
 * Naming it rather than folding it into `call` keeps an addition visible instead
 * of misreporting the message.
 */
export const unknownMessageKind = 'unknown'

/**
 * A block access list, as EIP-7928 orders it.
 *
 * Accounts are sorted by address and each account's entries by key, which evm2
 * applies on the way out, so a list read back is canonical whatever order it was
 * written in.
 */
export type Bal = {
  accounts: readonly BalAccount[]
}

/** One account's entries in a block access list. */
export type BalAccount = {
  address: Address.Address
  balanceChanges: readonly { balance: bigint; index: bigint }[]
  codeChanges: readonly { code: Hex.Hex; index: bigint }[]
  nonceChanges: readonly { index: bigint; nonce: bigint }[]
  storageChanges: readonly {
    changes: readonly { index: bigint; value: bigint }[]
    slot: bigint
  }[]
  storageReads: readonly bigint[]
}

/** Writes a block access list. */
function writeBal(writer: Writer, bal: Bal): void {
  writer.u32(bal.accounts.length)
  for (const account of bal.accounts) {
    writer.address(account.address)

    writer.u32(account.storageChanges.length)
    for (const slot of account.storageChanges) {
      writer.word(slot.slot)
      writer.u32(slot.changes.length)
      for (const change of slot.changes) {
        writer.u64(change.index)
        writer.word(change.value)
      }
    }
    writer.u32(account.storageReads.length)
    for (const slot of account.storageReads) writer.word(slot)
    writer.u32(account.balanceChanges.length)
    for (const change of account.balanceChanges) {
      writer.u64(change.index)
      writer.word(change.balance)
    }
    writer.u32(account.nonceChanges.length)
    for (const change of account.nonceChanges) {
      writer.u64(change.index)
      writer.u64(change.nonce)
    }
    writer.u32(account.codeChanges.length)
    for (const change of account.codeChanges) {
      writer.u64(change.index)
      writer.bytes(Bytes.fromHex(change.code))
    }
  }
}

/**
 * Decodes a block access list.
 *
 * Fields go into locals before the object is built: these are sequential reads,
 * so an object literal's property order would be the wire order.
 */
function readBal(reader: Reader): Bal {
  const accounts: BalAccount[] = []

  for (let count = reader.u32(); count > 0; count--) {
    const address = reader.address()

    const storageChanges: BalAccount['storageChanges'][number][] = []
    for (let slots = reader.u32(); slots > 0; slots--) {
      const slot = reader.word()
      const changes: { index: bigint; value: bigint }[] = []
      for (let entries = reader.u32(); entries > 0; entries--) {
        const index = reader.u64()
        const value = reader.word()
        changes.push({ index, value })
      }
      storageChanges.push({ changes, slot })
    }

    const storageReads: bigint[] = []
    for (let reads = reader.u32(); reads > 0; reads--)
      storageReads.push(reader.word())

    const balanceChanges: BalAccount['balanceChanges'][number][] = []
    for (let entries = reader.u32(); entries > 0; entries--) {
      const index = reader.u64()
      const balance = reader.word()
      balanceChanges.push({ balance, index })
    }

    const nonceChanges: BalAccount['nonceChanges'][number][] = []
    for (let entries = reader.u32(); entries > 0; entries--) {
      const index = reader.u64()
      const nonce = reader.u64()
      nonceChanges.push({ index, nonce })
    }

    const codeChanges: BalAccount['codeChanges'][number][] = []
    for (let entries = reader.u32(); entries > 0; entries--) {
      const index = reader.u64()
      const code = Hex.fromBytes(reader.bytes())
      codeChanges.push({ code, index })
    }

    accounts.push({
      address,
      balanceChanges,
      codeChanges,
      nonceChanges,
      storageChanges,
      storageReads,
    })
  }

  return { accounts }
}

/** Encodes a request attaching a block access list. */
export function encodeSetBal(options: encodeSetBal.Options): Bytes.Bytes {
  const writer = new Writer()
  writer.u32(options.fallback ? 1 : 0)
  writeBal(writer, options.bal)
  return writer.finish(op.setBal)
}

export declare namespace encodeSetBal {
  type Options = {
    /** List consulted on reads. */
    bal: Bal
    /** Whether a read the list does not cover may fall back to the database. */
    fallback: boolean
  }
}

/** Encodes a request enabling or discarding the block access list builder. */
export function encodeSetBalBuilder(enabled: boolean): Bytes.Bytes {
  const writer = new Writer()
  writer.u32(enabled ? 1 : 0)
  return writer.finish(op.setBalBuilder)
}

/** Encodes a request draining the built block access list. */
export function encodeTakeBal(): Bytes.Bytes {
  return new Writer().finish(op.takeBal)
}

/** Encodes a request setting the block access index. */
export function encodeSetBalIndex(index: bigint): Bytes.Bytes {
  const writer = new Writer()
  writer.u64(index)
  return writer.finish(op.setBalIndex)
}

/** Decodes a drained block access list, absent when no builder was enabled. */
export function decodeBal(bytes: Bytes.Bytes): Bal | undefined {
  const reader = new Reader(bytes)
  const built = reader.bool() ? readBal(reader) : undefined
  reader.finish()
  return built
}

/** Encodes a request installing or removing the inspector. */
export function encodeSetInspector(
  options: encodeSetInspector.Options,
): Bytes.Bytes {
  const writer = new Writer()
  writer.u32(options.enabled ? 1 : 0)
  writer.u32(options.steps ? 1 : 0)
  writer.u32(options.stack ? 1 : 0)
  writer.u32(options.memory ? 1 : 0)
  writer.u32(options.limit)
  return writer.finish(op.setInspector)
}

export declare namespace encodeSetInspector {
  type Options = {
    /** Whether an inspector is installed at all. */
    enabled: boolean
    /** Largest stream to keep, in bytes. */
    limit: number
    /** Records memory size on each step. */
    memory?: boolean | undefined
    /** Records the stack on each step. */
    stack?: boolean | undefined
    /** Records each instruction. */
    steps?: boolean | undefined
  }
}

/**
 * Decodes a trace, when the response carries one.
 *
 * Events keep the order evm2 called the hooks in. Nothing is interpreted here:
 * the shape a caller wants is built from this stream rather than encoded into it.
 */
export function decodeTrace(reader: Reader): Trace | undefined {
  if (!reader.bool()) return undefined
  const truncated = reader.bool()
  const stream = new Reader(reader.bytes())
  const events_: TraceEvent[] = []

  while (true) {
    const tag = stream.u8()
    if (tag === events.end) break
    events_.push(readEvent(stream, tag))
  }
  return { events: events_, truncated }
}

/**
 * Reads one event.
 *
 * Fields go into locals before the object is built: these are sequential reads,
 * so an object literal's property order would be the wire order.
 *
 * @internal
 */
function readEvent(reader: Reader, tag: number): TraceEvent {
  if (tag === events.initialize) {
    const depth = reader.u16()
    const gas = reader.u64()
    return { depth, gas, kind: 'initialize' }
  }
  if (tag === events.step) {
    const pc = reader.u32()
    const opcode = reader.u8()
    const depth = reader.u16()
    const gas = reader.u64()
    const memorySize = reader.u32()
    const stack: bigint[] = []
    for (let count = reader.u16(); count > 0; count--) stack.push(reader.word())
    return { depth, gas, kind: 'step', memorySize, opcode, pc, stack }
  }
  if (tag === events.stepEnd) {
    const gas = reader.u64()
    return { gas, kind: 'stepEnd' }
  }
  if (tag === events.log) {
    const address = reader.address()
    const topics: Hex.Hex[] = []
    for (let count = reader.u8(); count > 0; count--) topics.push(reader.hash())
    const data = Hex.fromBytes(reader.bytes())
    return { address, data, kind: 'log', topics }
  }
  if (tag === events.call || tag === events.create) {
    const messageKind = messageKinds[reader.u8()] ?? unknownMessageKind
    const depth = reader.u16()
    const gasLimit = reader.u64()
    const caller = reader.address()
    const destination = reader.address()
    const codeAddress = reader.address()
    const value = reader.word()
    const input = Hex.fromBytes(reader.bytes())
    return {
      caller,
      codeAddress,
      depth,
      destination,
      gasLimit,
      input,
      kind: tag === events.call ? 'call' : 'create',
      messageKind,
      value,
    }
  }
  if (tag === events.callEnd || tag === events.createEnd) {
    const stop = reader.u8()
    const gasRemaining = reader.u64()
    const gasSpent = reader.u64()
    const createdAddress = reader.bool() ? reader.address() : undefined
    const output = Hex.fromBytes(reader.bytes())
    return {
      ...(createdAddress ? { createdAddress } : {}),
      gasRemaining,
      gasSpent,
      kind: tag === events.callEnd ? 'callEnd' : 'createEnd',
      output,
      stop,
    }
  }
  if (tag === events.selfdestruct) {
    const contract = reader.address()
    const target = reader.address()
    const value = reader.word()
    return { contract, kind: 'selfdestruct', target, value }
  }
  throw new DecodeError(`unknown trace event ${tag}`)
}

/** One recorded hook call. */
export type TraceEvent =
  | {
      address: Address.Address
      data: Hex.Hex
      kind: 'log'
      topics: readonly Hex.Hex[]
    }
  | {
      caller: Address.Address
      codeAddress: Address.Address
      depth: number
      destination: Address.Address
      gasLimit: bigint
      input: Hex.Hex
      kind: 'call' | 'create'
      messageKind: (typeof messageKinds)[number] | typeof unknownMessageKind
      value: bigint
    }
  | {
      contract: Address.Address
      kind: 'selfdestruct'
      target: Address.Address
      value: bigint
    }
  | {
      createdAddress?: Address.Address | undefined
      gasRemaining: bigint
      gasSpent: bigint
      kind: 'callEnd' | 'createEnd'
      output: Hex.Hex
      stop: number
    }
  | { depth: number; gas: bigint; kind: 'initialize' }
  | {
      depth: number
      gas: bigint
      kind: 'step'
      memorySize: number
      opcode: number
      pc: number
      stack: readonly bigint[]
    }
  | { gas: bigint; kind: 'stepEnd' }

/** A recorded execution. */
export type Trace = {
  /** Hook calls, in the order evm2 made them. */
  events: readonly TraceEvent[]
  /** Whether the byte limit stopped recording before execution finished. */
  truncated: boolean
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

  // Always present, even as a lone `false`: an execution reports whether it was
  // traced so this decoder consumes the whole payload either way.
  const trace = decodeTrace(reader)
  reader.finish()

  return {
    ...result,
    createdAddress,
    errorCode,
    logs,
    output,
    ...(trace ? { trace } : {}),
  }
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
