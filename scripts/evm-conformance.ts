// Runs the `ethereum/execution-spec-tests` state tests against the Ox EVM.
//
//   bun scripts/evm-conformance.ts <fixtures-dir> [--fork Prague] [--limit N]
//                                 [--filter substring] [--show N]
//
// State tests carry an explicit expected post-state, so conformance is an
// account-by-account comparison and needs no Merkle-Patricia trie.
//
// The transaction layer lives here rather than in the engine: intrinsic gas,
// nonce and balance checks, the refund cap, and the coinbase payment are not
// hot, and keeping them out of C keeps the engine to executing frames.
//
// Status: 40423/40553 (99.68%) across all forks. This is the same fixture set
// that Reth's `ef-tests` and evm2's `evm2-eest` run against.
//
// What is left, largest first:
//
//   - Deep-recursion gas accounting in stStaticCall and stCallCreateCallCode,
//     where the discrepancy is tens of thousands of gas across a thousand-frame
//     chain. `--trace-case` is the tool for these; see below.
//   - A residue of small gas deltas spread across the call tests.
//
// Blockchain tests are not run at all: they need block processing and a
// Merkle-Patricia trie for the state root, which state tests avoid by shipping
// an explicit post-state.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import * as Hash from '../src/core/Hash.js'
import * as Rlp from '../src/core/Rlp.js'
import * as Secp256k1 from '../src/core/Secp256k1.js'
import * as Opcode from '../src/evm/Opcode.js'
import { wasmBase64 } from '../src/evm/internal/evm.wasm.js'

type Hex = `0x${string}`

const STAGE_ADDR = 0
const STAGE_ADDR2 = 20
const STAGE_WORD_A = 64
const STAGE_WORD_B = 96
const STAGE_BYTES = 128

const status = [
  'success',
  'reverted',
  'out-of-gas',
  'stack-underflow',
  'stack-overflow',
  'invalid-opcode',
  'invalid-jump',
  'out-of-memory',
  'code-too-large',
  'input-too-large',
  'static-violation',
] as const

// `OX_WASM` points at a build other than the committed one — in practice the
// tracing build from `build-evm.ts --trace`, which `--trace-case` needs.
const binary = process.env.OX_WASM
  ? new Uint8Array(readFileSync(process.env.OX_WASM))
  : Uint8Array.from(Buffer.from(wasmBase64, 'base64'))
const module_ = new WebAssembly.Module(binary)

let engine: any
let vm: number

/**
 * Instantiates a fresh engine.
 *
 * Called again after any trap: a wasm trap leaves the shadow stack pointer
 * where it was, so a poisoned instance traps on every later call and one bad
 * case would be reported as tens of thousands.
 */
function instantiate() {
  engine = new WebAssembly.Instance(module_, {}).exports as any
  vm = engine.evm_new(0)
  // `evm_new` returns a null pointer when it cannot grow linear memory far
  // enough. Every later call would then write through it and trap, which looks
  // like an engine bug rather than the resource exhaustion it is.
  if (!vm) throw new Error('evm_new returned null: out of wasm memory')
}
instantiate()
const mem = () => new Uint8Array(engine.memory.buffer)
const stage = () => engine.evm_stage_ptr(vm)

function bytes(hex: string | undefined): Uint8Array {
  if (!hex || hex === '0x') return new Uint8Array(0)
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const p = h.length % 2 ? `0${h}` : h
  const out = new Uint8Array(p.length / 2)
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(p.slice(i * 2, i * 2 + 2), 16)
  return out
}
const big = (hex: string | undefined): bigint =>
  !hex || hex === '0x' ? 0n : BigInt(hex)
const toHex = (b: Uint8Array): Hex => `0x${Buffer.from(b).toString('hex')}`

/** Writes a bigint as 32 big-endian bytes at `offset` in the staging buffer. */
function putWord(offset: number, value: bigint) {
  const buf = new Uint8Array(32)
  let v = value & ((1n << 256n) - 1n)
  for (let i = 31; i >= 0; i--) {
    buf[i] = Number(v & 0xffn)
    v >>= 8n
  }
  mem().set(buf, stage() + offset)
}
function putAddr(offset: number, addr: string) {
  const a = bytes(addr)
  const buf = new Uint8Array(20)
  buf.set(a.subarray(Math.max(0, a.length - 20)), 20 - Math.min(20, a.length))
  mem().set(buf, stage() + offset)
}
const getWord = (offset: number): bigint =>
  BigInt(
    `0x${Buffer.from(mem().slice(stage() + offset, stage() + offset + 32)).toString('hex')}`,
  )
const getAddr = (offset: number): Hex =>
  `0x${Buffer.from(mem().slice(stage() + offset, stage() + offset + 20)).toString('hex')}`

type Account = {
  nonce: string
  balance: string
  code: string
  storage: Record<string, string>
}

/** Forks that changed intrinsic-gas or refund rules the runner models. */
const forkOrder = [
  'Frontier',
  'Homestead',
  'Byzantium',
  'ConstantinopleFix',
  'Istanbul',
  'Berlin',
  'London',
  'Paris',
  'Shanghai',
  'Cancun',
  'Prague',
]
const forkAtLeast = (fork: string, min: string) =>
  forkOrder.indexOf(fork) >= forkOrder.indexOf(min)

/**
 * The engine's `spec` id for a fork name.
 *
 * The engine numbers every fork that repriced something, including ones no
 * fixture targets directly (Tangerine, Spurious Dragon, Constantinople), so
 * these ids are not contiguous over `forkOrder`.
 */
const specIds: Record<string, number> = {
  Frontier: 0,
  Homestead: 1,
  Byzantium: 4,
  ConstantinopleFix: 6,
  Istanbul: 7,
  Berlin: 8,
  London: 9,
  Paris: 10,
  Shanghai: 11,
  Cancun: 12,
  Prague: 13,
}

/** EIP-2028/7623 intrinsic gas for the calldata and access list. */
function intrinsicGas(
  data: Uint8Array,
  isCreate: boolean,
  accessList: { address: string; storageKeys?: string[] }[] | undefined,
  fork: string,
) {
  let zero = 0
  for (const b of data) if (b === 0) zero++
  const nonZero = data.length - zero
  let gas = 21000n
  gas +=
    BigInt(zero) * 4n +
    BigInt(nonZero) * (forkAtLeast(fork, 'Istanbul') ? 16n : 68n)
  if (isCreate && forkAtLeast(fork, 'Homestead')) gas += 32000n
  if (isCreate && forkAtLeast(fork, 'Shanghai'))
    gas += 2n * BigInt(Math.ceil(data.length / 32)) // EIP-3860 initcode word cost
  for (const item of accessList ?? []) {
    gas += 2400n
    gas += BigInt(item.storageKeys?.length ?? 0) * 1900n
  }
  // EIP-7623: a transaction pays at least a per-token floor.
  let floor = 0n
  if (forkAtLeast(fork, 'Prague')) {
    const tokens = BigInt(zero) + BigInt(nonZero) * 4n
    floor = 21000n + tokens * 10n
  }
  return { gas, floor }
}

/** Highest precompile address defined at each fork. */
function precompileCount(fork: string) {
  if (forkAtLeast(fork, 'Prague')) return 0x11 // EIP-2537 BLS12-381
  if (forkAtLeast(fork, 'Cancun')) return 0x0a // EIP-4844 point evaluation
  if (forkAtLeast(fork, 'Istanbul')) return 0x09 // EIP-152 blake2f
  if (forkAtLeast(fork, 'Byzantium')) return 0x08 // bn254 + modexp
  return 0x04
}

const GAS_PER_BLOB = 131072n

/**
 * EIP-4844 `fake_exponential`: `factor * e ** (numerator / denominator)`
 * approximated with integer arithmetic.
 */
function fakeExponential(factor: bigint, numerator: bigint, denom: bigint) {
  let i = 1n
  let output = 0n
  let accum = factor * denom
  while (accum > 0n) {
    output += accum
    accum = (accum * numerator) / (denom * i)
    i += 1n
  }
  return output / denom
}

/** The blob base fee for a block's excess blob gas. */
function blobBaseFeeOf(excess: bigint, fork: string) {
  // EIP-7691 raised the update fraction along with the target blob count.
  const fraction = forkAtLeast(fork, 'Prague') ? 5007716n : 3338477n
  return fakeExponential(1n, excess, fraction)
}

function warmPreamble(
  sender: string,
  to: string | undefined,
  fork: string,
  coinbase?: string,
) {
  putAddr(STAGE_ADDR, sender)
  engine.evm_warm_account(vm)
  if (to) {
    putAddr(STAGE_ADDR, to)
    engine.evm_warm_account(vm)
  }
  // EIP-3651 added the coinbase to the accessed set at Shanghai.
  if (coinbase && forkAtLeast(fork, 'Shanghai')) {
    putAddr(STAGE_ADDR, coinbase)
    engine.evm_warm_account(vm)
  }
  for (let i = 1; i <= precompileCount(fork); i++) {
    putAddr(STAGE_ADDR, `0x${i.toString(16).padStart(40, '0')}`)
    engine.evm_warm_account(vm)
  }
}

const SECP_N =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

/** RLP takes minimal big-endian bytes, so a zero is the empty string. */
function minimal(v: bigint): Hex {
  if (v === 0n) return '0x'
  let h = v.toString(16)
  if (h.length % 2) h = `0${h}`
  return `0x${h}`
}

type Authorization = {
  chainId: string
  address: string
  nonce: string
  r: string
  s: string
  yParity?: string
  v?: string
}

/**
 * Recovers the authority of an EIP-7702 authorization tuple, or `undefined` if
 * the tuple is malformed.
 *
 * The signed payload is `keccak(0x05 || rlp([chain_id, address, nonce]))`.
 */
function authority(auth: Authorization, chainId: bigint): Hex | undefined {
  const r = big(auth.r)
  const sig = big(auth.s)
  const yParity = Number(big(auth.yParity ?? auth.v))
  if (r === 0n || sig === 0n || r >= SECP_N) return undefined
  // EIP-2 rejects the high half of the s range.
  if (sig > SECP_N / 2n) return undefined
  if (yParity !== 0 && yParity !== 1) return undefined
  const authChain = big(auth.chainId)
  if (authChain !== 0n && authChain !== chainId) return undefined
  const nonce = big(auth.nonce)
  if (nonce >= 1n << 64n) return undefined
  const encoded = Rlp.fromHex([
    minimal(authChain),
    auth.address as Hex,
    minimal(nonce),
  ])
  const payload = Hash.keccak256(`0x05${encoded.slice(2)}` as Hex)
  try {
    return Secp256k1.recoverAddress({
      payload,
      // `Signature` carries r and s as 32-byte hex, not as bigints.
      signature: {
        r: `0x${r.toString(16).padStart(64, '0')}`,
        s: `0x${sig.toString(16).padStart(64, '0')}`,
        yParity,
      },
    }).toLowerCase() as Hex
  } catch {
    return undefined
  }
}

type Outcome = { ok: true } | { ok: false; reason: string; detail?: string }

/** Compares the engine's current state against the expected post-state. */
function compareLoaded(post: any): Outcome {
  lastRc = 0
  return compare(
    new Map(readState().map((a) => [a.address, a])),
    post.state,
    readStorage(),
  )
}

/**
 * Applies a set-code transaction's authorization list and returns the gas to
 * refund.
 *
 * Each tuple is validated independently; an invalid one is skipped but still
 * paid for. Authorities are warmed whether or not the tuple applies.
 */
function applyAuthorizations(
  authList: Authorization[],
  chainId: bigint,
  pre: Record<string, Account>,
): bigint {
  let refund = 0n
  // The refund is for an authority already in the trie. The runner writes the
  // transaction's recipient into the engine as part of moving value, which can
  // conjure an account that the trie does not have, so pre-state membership is
  // the authority on this rather than the engine's current view.
  const created = new Set<string>()
  for (const auth of authList) {
    const who = authority(auth, chainId)
    if (!who) continue
    putAddr(STAGE_ADDR, who)
    engine.evm_warm_account(vm)

    const current = readState().find((a) => a.address === who)
    const code = current ? bytes(current.code) : new Uint8Array(0)
    // Only an empty account or one already delegating may be re-delegated.
    const delegating =
      code.length === 23 &&
      code[0] === 0xef &&
      code[1] === 0x01 &&
      code[2] === 0x00
    if (code.length !== 0 && !delegating) continue
    const nonce = current?.nonce ?? 0n
    if (nonce !== big(auth.nonce)) continue
    // A nonce at the u64 ceiling cannot be bumped, so the tuple does not apply.
    if (nonce === (1n << 64n) - 1n) continue
    // PER_EMPTY_ACCOUNT_COST - PER_AUTH_BASE_COST, for an account in the trie.
    if (pre[who] || created.has(who)) refund += 12500n
    created.add(who)

    const target = bytes(auth.address)
    // The zero address is the way to undelegate: it clears the code instead of
    // writing a designation.
    const designation =
      big(auth.address) === 0n
        ? new Uint8Array(0)
        : Uint8Array.from([0xef, 0x01, 0x00, ...target])
    putAddr(STAGE_ADDR, who)
    putWord(STAGE_WORD_A, current?.balance ?? 0n)
    mem().set(designation, stage() + STAGE_BYTES)
    engine.evm_put_account(vm, nonce + 1n, designation.length)
  }
  return refund
}

// Set per case so `compare` can express a balance mismatch in gas units.
let gasPriceForDetail = 0n
let lastRc = 0

function runCase(test: any, fork: string, post: any): Outcome {
  const tx = test.transaction
  const idx = post.indexes
  const data = bytes(tx.data[idx.data])
  const gasLimit = big(tx.gasLimit[idx.gas])
  const value = big(tx.value[idx.value])
  const isCreate = !tx.to || tx.to === '0x' || tx.to === ''

  const accessList = tx.accessLists?.[idx.data] ?? tx.accessList
  const authList: Authorization[] = tx.authorizationList ?? []

  engine.evm_reset(vm)

  // Pre-state.
  for (const [addr, acct] of Object.entries(
    test.pre as Record<string, Account>,
  )) {
    const code = bytes(acct.code)
    putAddr(STAGE_ADDR, addr)
    putWord(STAGE_WORD_A, big(acct.balance))
    mem().set(code, stage() + STAGE_BYTES)
    const rc = engine.evm_put_account(vm, big(acct.nonce), code.length)
    if (rc !== 0) return { ok: false, reason: 'state-capacity' }
    for (const [k, v] of Object.entries(acct.storage ?? {})) {
      putAddr(STAGE_ADDR, addr)
      putWord(STAGE_WORD_A, big(k))
      putWord(STAGE_WORD_B, big(v))
      if (engine.evm_put_storage(vm) !== 0)
        return { ok: false, reason: 'state-capacity' }
    }
  }

  // Environment.
  const env = test.env
  const baseFee = big(env.currentBaseFee)
  putAddr(STAGE_ADDR, tx.sender)
  putAddr(STAGE_ADDR2, env.currentCoinbase)
  const maxFee = tx.maxFeePerGas ? big(tx.maxFeePerGas) : big(tx.gasPrice)
  const maxPriority = tx.maxPriorityFeePerGas
    ? big(tx.maxPriorityFeePerGas)
    : big(tx.gasPrice)
  // biome-ignore lint/style/noCommaOperator: assignment before use
  const effectiveGasPrice = tx.maxFeePerGas
    ? baseFee +
      (maxFee - baseFee < maxPriority ? maxFee - baseFee : maxPriority)
    : big(tx.gasPrice)
  gasPriceForDetail = effectiveGasPrice
  putWord(64, effectiveGasPrice)
  putWord(96, baseFee)
  // EIP-4844. The data fee is burnt, so it leaves the sender's balance without
  // reaching the coinbase; `BLOBBASEFEE` and `BLOBHASH` read the same values.
  const blobHashes: string[] = tx.blobVersionedHashes ?? []
  const excessBlobGas = big(env.currentExcessBlobGas)
  const blobBaseFee = forkAtLeast(fork, 'Cancun')
    ? blobBaseFeeOf(excessBlobGas, fork)
    : 0n
  const blobFee = BigInt(blobHashes.length) * GAS_PER_BLOB * blobBaseFee
  putWord(128, blobBaseFee)
  putWord(160, big(env.currentRandom ?? env.currentDifficulty))
  putWord(192, big(test.config?.chainid ?? '0x01'))
  for (let i = 0; i < Math.min(blobHashes.length, 16); i++)
    putWord(224 + i * 32, big(blobHashes[i]))
  engine.evm_set_context(
    vm,
    big(env.currentNumber),
    big(env.currentTimestamp),
    big(env.currentGasLimit),
    Math.min(blobHashes.length, 16),
    0,
    specIds[fork] ?? 13,
  )

  // EIP-2930 access list warms addresses and slots before execution.
  for (const item of accessList ?? []) {
    putAddr(STAGE_ADDR, item.address)
    engine.evm_warm_account(vm)
    for (const k of item.storageKeys ?? []) {
      putAddr(STAGE_ADDR, item.address)
      putWord(STAGE_WORD_A, big(k))
      engine.evm_warm_storage(vm)
    }
  }

  const { gas: intrinsic, floor } = intrinsicGas(
    data,
    isCreate,
    accessList,
    fork,
  )
  // EIP-7702 charges PER_EMPTY_ACCOUNT_COST per authorization up front.
  const authGas = BigInt(authList.length) * 25000n
  // An invalid transaction is rejected outright: no nonce bump, no gas charged,
  // no execution. The expected post-state is simply the pre-state, which is
  // what the engine currently holds.
  // EIP-7623 makes the floor part of the validity requirement, not just the
  // settlement: a transaction whose limit cannot cover the larger of the two is
  // rejected before it runs. The authorization cost belongs *inside* that
  // comparison, as part of the intrinsic gas — adding it to the maximum
  // instead rejected set-code transactions whose limit sat between the two.
  const withAuth = intrinsic + authGas
  const required = withAuth > floor ? withAuth : floor
  if (required > gasLimit) return compareLoaded(post)
  // A set-code transaction must have at least one authorization and must not be
  // a create.
  if (tx.authorizationList && (authList.length === 0 || isCreate))
    return compareLoaded(post)

  // Sender pays upfront and its nonce advances before execution.
  const senderPre = (test.pre as Record<string, Account>)[
    tx.sender.toLowerCase()
  ]
  const senderBalance = big(senderPre?.balance)
  // EIP-3607: a transaction from an account with deployed code is invalid, so
  // that an address cannot be both a contract and an externally-owned account.
  // EIP-7702 carved out the delegation designator, which is code but is not a
  // contract — that is the whole point of a set-code transaction.
  if (forkAtLeast(fork, 'London')) {
    const senderCodeHex = (senderPre?.code ?? '0x').toLowerCase()
    const delegating =
      forkAtLeast(fork, 'Prague') && senderCodeHex.startsWith('0xef0100')
    if (senderCodeHex !== '0x' && senderCodeHex !== '' && !delegating)
      return compareLoaded(post)
  }
  // A blob transaction is invalid if it cannot pay the block's blob base fee.
  if (blobHashes.length && big(tx.maxFeePerBlobGas) < blobBaseFee)
    return compareLoaded(post)
  // Type-specific validity. A rejected transaction leaves the pre-state
  // untouched, which is what the engine currently holds.
  // `maxFeePerBlobGas` is what makes a transaction type 3, not the presence of
  // blobs: an empty blob list is exactly what one of these tests sends.
  if (tx.maxFeePerBlobGas !== undefined) {
    if (!forkAtLeast(fork, 'Cancun')) return compareLoaded(post)
    // EIP-7691 raised the per-block maximum from 6 to 9.
    const maxBlobs = forkAtLeast(fork, 'Prague') ? 9 : 6
    if (blobHashes.length === 0 || blobHashes.length > maxBlobs)
      return compareLoaded(post)
    // A blob transaction cannot be a create, and every hash must carry the
    // version byte.
    if (isCreate) return compareLoaded(post)
    for (const h of blobHashes)
      if (!h.startsWith('0x01')) return compareLoaded(post)
  }
  // EIP-1559: the fee cap has to cover the base fee. That applies to a legacy
  // transaction's `gasPrice` too — it is both caps at once, and one that
  // cannot pay the base fee is as invalid as a type-2 that cannot.
  if (forkAtLeast(fork, 'London') && maxFee < baseFee)
    return compareLoaded(post)
  // A tip above the fee cap is nonsense and rejected, rather than clamped.
  if (tx.maxPriorityFeePerGas !== undefined && maxPriority > maxFee)
    return compareLoaded(post)
  // EIP-2681 caps an account's nonce at 2^64 - 1, so a transaction at that
  // nonce could never be followed by another and is refused outright.
  if (big(tx.nonce) >= (1n << 64n) - 1n) return compareLoaded(post)
  if (tx.authorizationList && !forkAtLeast(fork, 'Prague'))
    return compareLoaded(post)
  // EIP-3860 caps initcode at twice the deployed-code limit.
  if (isCreate && forkAtLeast(fork, 'Shanghai') && data.length > 49152)
    return compareLoaded(post)

  // Validity is judged against the caps the sender signed, not the effective
  // price: a transaction that cannot cover `gasLimit * maxFeePerGas` plus the
  // blob allowance is rejected before it runs.
  const maxBlobFee =
    BigInt(blobHashes.length) * GAS_PER_BLOB * big(tx.maxFeePerBlobGas)
  if (senderBalance < gasLimit * maxFee + value + maxBlobFee)
    return compareLoaded(post)

  // Only the gas is deducted here. For a call the runner moves the value
  // below; for a create `evm_execute_create` moves it, so deducting it here as
  // well would double-charge the sender.
  putAddr(STAGE_ADDR, tx.sender)
  putWord(
    STAGE_WORD_A,
    senderBalance -
      gasLimit * effectiveGasPrice -
      blobFee -
      (isCreate ? 0n : value),
  )
  const senderCode = bytes(senderPre?.code)
  mem().set(senderCode, stage() + STAGE_BYTES)
  engine.evm_put_account(vm, big(senderPre?.nonce) + 1n, senderCode.length)

  const toAddr = isCreate ? '' : tx.to.toLowerCase()
  let rc: number
  if (isCreate) {
    // A create transaction runs the calldata as initcode; the engine derives
    // the address from the sender's pre-increment nonce.
    putAddr(STAGE_ADDR2, tx.sender)
    putWord(STAGE_WORD_A, value)
    mem().set(data, stage() + STAGE_BYTES)
    warmPreamble(tx.sender, undefined, fork, env.currentCoinbase)
    rc = engine.evm_execute_create(vm, data.length, gasLimit - intrinsic)
    // `evm_execute_create` moves the value inside its own snapshot, so a
    // failure has already rolled it back and the runner must not undo it again.
    return settleAndCompare(
      rc,
      gasLimit,
      intrinsic,
      floor,
      fork,
      tx,
      env,
      effectiveGasPrice,
      baseFee,
      post,
      0n,
      '',
    )
  }

  // Recipient receives the value. When the sender is also the recipient the
  // two writes target one account, so the credit has to build on the balance
  // the sender write just produced rather than on the pre-state.
  const toPre = (test.pre as Record<string, Account>)[toAddr]
  const toCode = bytes(toPre?.code)
  const senderAdjusted =
    senderBalance - gasLimit * effectiveGasPrice - blobFee - value
  const toBase =
    toAddr === tx.sender.toLowerCase() ? senderAdjusted : big(toPre?.balance)
  putAddr(STAGE_ADDR, toAddr)
  putWord(STAGE_WORD_A, toBase + value)
  mem().set(toCode, stage() + STAGE_BYTES)
  engine.evm_put_account(
    vm,
    toAddr === tx.sender.toLowerCase()
      ? big(senderPre?.nonce) + 1n
      : big(toPre?.nonce),
    toCode.length,
  )

  // Authorizations land before execution so the delegations they write are
  // visible to the first frame, and after the sender and recipient writes above
  // because those come from the pre-state and would otherwise clobber them.
  const authRefund = applyAuthorizations(
    authList,
    big(test.config?.chainid ?? '0x01'),
    test.pre as Record<string, Account>,
  )

  // EIP-2929 seeds the accessed-address set with the sender, the target, and
  // every precompile. Missing the precompiles made each precompile call pay
  // the cold 2600 instead of the warm 100.
  warmPreamble(tx.sender, toAddr, fork, env.currentCoinbase)

  // Execute.
  putAddr(STAGE_ADDR, toAddr)
  putAddr(STAGE_ADDR2, tx.sender)
  putWord(STAGE_WORD_A, value)
  mem().set(data, stage() + STAGE_BYTES)
  const execGas = gasLimit - intrinsic - authGas
  rc = engine.evm_execute(vm, data.length, execGas, 0)
  return settleAndCompare(
    rc,
    gasLimit,
    intrinsic,
    floor,
    fork,
    tx,
    env,
    effectiveGasPrice,
    baseFee,
    post,
    value,
    toAddr,
    authRefund,
  )
}

/** Applies the gas refund, repays the sender, pays the coinbase, compares. */
function settleAndCompare(
  rc: number,
  gasLimit: bigint,
  _intrinsic: bigint,
  floor: bigint,
  fork: string,
  tx: any,
  env: any,
  effectiveGasPrice: bigint,
  baseFee: bigint,
  post: any,
  value: bigint,
  toAddr: string,
  extraRefund = 0n,
): Outcome {
  lastRc = rc
  const gasLeft = engine.evm_gas_left(vm)
  const refundCounter = BigInt(engine.evm_refund(vm)) + extraRefund

  let gasUsed = gasLimit - gasLeft
  if (rc !== 0 && extraRefund > 0n) {
    // An authorization is processed before execution, so its refund stands even
    // when the top-level frame reverts.
    const cap = gasUsed / 5n
    gasUsed -= extraRefund < cap ? extraRefund : cap
  }
  if (rc === 0) {
    // EIP-3529 caps the refund at a fifth of the gas consumed. The counter can
    // be negative mid-transaction; a negative total refunds nothing.
    const counter = refundCounter > 0n ? refundCounter : 0n
    // EIP-3529 tightened the cap from a half to a fifth.
    const cap = forkAtLeast(fork, 'London') ? gasUsed / 5n : gasUsed / 2n
    gasUsed -= counter < cap ? counter : cap
  }
  if (forkAtLeast(fork, 'Prague') && gasUsed < floor) gasUsed = floor

  // Settle: sender is repaid the unused gas, coinbase collects the tip.
  const post_ = readState()
  const senderIdx = post_.findIndex(
    (a) => a.address === tx.sender.toLowerCase(),
  )
  const settle = new Map(post_.map((a) => [a.address, a]))
  const sender = settle.get(tx.sender.toLowerCase())
  // The runner performs the call-path value transfer outside the engine, as
  // part of loading state, so the engine's journal cannot roll it back. Undo it
  // here when the top-level frame did not succeed — REVERT included.
  if (rc !== 0 && value > 0n && toAddr) {
    const to = settle.get(toAddr as Hex)
    if (to) to.balance -= value
    if (sender) sender.balance += value
  }
  if (sender) sender.balance += (gasLimit - gasUsed) * effectiveGasPrice
  const cbAddr =
    `0x${bytes(env.currentCoinbase).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}` as Hex
  // The base fee is burned for every transaction type from London onward, so
  // the coinbase receives only the priority portion. Pre-London `baseFee` is
  // zero and this reduces to the full gas price.
  const tip = effectiveGasPrice - baseFee
  const cb = settle.get(cbAddr)
  if (cb) cb.balance += gasUsed * tip
  else if (gasUsed * tip > 0n)
    settle.set(cbAddr, {
      address: cbAddr,
      balance: gasUsed * tip,
      nonce: 0n,
      code: '0x',
    })
  void senderIdx

  return compare(settle, post.state, readStorage())
}

type Acct = { address: Hex; balance: bigint; nonce: bigint; code: Hex }

function readState(): Acct[] {
  const out: Acct[] = []
  const n = engine.evm_account_count(vm)
  for (let i = 0; i < n; i++) {
    const codeLen = engine.evm_account_at(vm, i)
    if (codeLen < 0) continue
    out.push({
      address: getAddr(STAGE_ADDR),
      balance: getWord(STAGE_WORD_A),
      // The export returns i64, so a nonce past 2^63 comes back negative.
      nonce: BigInt.asUintN(64, BigInt(engine.evm_account_nonce(vm, i))),
      code: toHex(
        mem().slice(stage() + STAGE_BYTES, stage() + STAGE_BYTES + codeLen),
      ),
    })
  }
  return out
}

function readStorage(): Map<string, Map<bigint, bigint>> {
  const out = new Map<string, Map<bigint, bigint>>()
  const n = engine.evm_storage_count(vm)
  for (let i = 0; i < n; i++) {
    if (engine.evm_storage_at(vm, i) !== 1) continue
    const addr = getAddr(STAGE_ADDR)
    const key = getWord(STAGE_WORD_A)
    const value = getWord(STAGE_WORD_B)
    let m = out.get(addr)
    if (!m) out.set(addr, (m = new Map()))
    m.set(key, value)
  }
  return out
}

function compare(
  actual: Map<string, Acct>,
  expected: Record<string, Account>,
  storage: Map<string, Map<bigint, bigint>>,
): Outcome {
  // `DIFF=1` reports every mismatching account rather than the first, which is
  // what tells a gas discrepancy (the sender pays) from a value one.
  if (process.env.DIFF)
    for (const [rawAddr, want] of Object.entries(expected)) {
      const addr = rawAddr.toLowerCase() as Hex
      const got = actual.get(addr)
      if (!got) console.log(`DIFF ${addr} missing`)
      else if (got.balance !== big(want.balance))
        console.log(
          `DIFF ${addr} balance got ${got.balance} want ${big(want.balance)} delta ${got.balance - big(want.balance)}`,
        )
      else if (got.nonce !== big(want.nonce))
        console.log(`DIFF ${addr} nonce got ${got.nonce} want ${big(want.nonce)}`)
    }
  for (const [rawAddr, want] of Object.entries(expected)) {
    const addr = rawAddr.toLowerCase() as Hex
    const got = actual.get(addr)
    if (!got) return { ok: false, reason: 'missing-account', detail: addr }
    if (got.balance !== big(want.balance))
      return {
        ok: false,
        reason: 'balance',
        detail: `${addr} rc=${status[lastRc] ?? lastRc} wei-delta ${got.balance - big(want.balance)}${
          gasPriceForDetail
            ? ` gas-delta ${(got.balance - big(want.balance)) / gasPriceForDetail}`
            : ''
        }`,
      }
    if (got.nonce !== big(want.nonce))
      return {
        ok: false,
        reason: 'nonce',
        detail: `${addr} got ${got.nonce} want ${big(want.nonce)}`,
      }
    if (got.code.toLowerCase() !== (want.code || '0x').toLowerCase())
      return { ok: false, reason: 'code', detail: addr }
    // Compare storage in both directions, keyed by numeric slot so that
    // `0x1` and `0x01` are the same slot.
    const slots = storage.get(addr) ?? new Map<bigint, bigint>()
    const wanted = new Map<bigint, bigint>()
    for (const [k, v] of Object.entries(want.storage ?? {}))
      if (big(v) !== 0n) wanted.set(big(k), big(v))
    for (const [k, v] of wanted) {
      const have = slots.get(k) ?? 0n
      if (have !== v)
        return {
          ok: false,
          reason: 'storage',
          detail: `${addr}[0x${k.toString(16)}] got ${have} want ${v}`,
        }
    }
    for (const [k, v] of slots)
      if (v !== 0n && !wanted.has(k))
        return {
          ok: false,
          reason: 'extra-storage',
          detail: `${addr}[0x${k.toString(16)}]=${v}`,
        }
  }
  return { ok: true }
}

// --- driver ---

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (entry.endsWith('.json')) yield p
  }
}

const args = process.argv.slice(2)
const root = args[0]
if (!root) {
  console.error('usage: evm-conformance.ts <fixtures/state_tests> [options]')
  process.exit(2)
}
const opt = (name: string) => {
  const i = args.indexOf(name)
  return i < 0 ? undefined : args[i + 1]
}
const onlyFork = opt('--fork')
const limit = Number(opt('--limit') ?? Number.POSITIVE_INFINITY)
const filter = opt('--filter')
const show = Number(opt('--show') ?? 8)
// `--trace-case <substring>` dumps a per-instruction trace for the first case
// whose name matches, then exits. Needs the tracing build:
//
//   node --import tsx scripts/build-evm.ts --trace /tmp/evm.trace.wasm
//   OX_WASM=/tmp/evm.trace.wasm node --import tsx scripts/evm-conformance.ts \
//     <fixtures> --trace-case <substring>
const traceCase = opt('--trace-case')
if (traceCase && !engine.evm_trace_ptr)
  throw new Error('--trace-case needs OX_WASM pointing at a --trace build')

function dumpTrace() {
  const n = engine.evm_trace_count(vm)
  const base = engine.evm_trace_ptr(vm)
  const view = new DataView(engine.memory.buffer)
  console.log(`\n${n} steps  (pc, op, gas before, cost, depth, stack height)`)
  let prev: { gas: bigint; depth: number } | undefined
  for (let i = 0; i < n; i++) {
    const o = base + i * 24
    const pc = view.getInt32(o, true)
    const op = view.getInt32(o + 4, true)
    const gas = view.getBigInt64(o + 8, true)
    const depth = view.getInt32(o + 16, true)
    const sp = view.getInt32(o + 20, true)
    // The cost of the *previous* instruction, which is the interesting column;
    // it is only meaningful within one frame.
    const cost =
      prev && prev.depth === depth ? String(prev.gas - gas).padStart(8) : '        '
    if (i > 0) process.stdout.write(`${cost}\n`)
    process.stdout.write(
      `${String(i).padStart(6)}  d${depth} pc=${String(pc).padStart(5)} ` +
        `${Opcode.toName(op) ?? `0x${op.toString(16)}`}`.padEnd(22) +
        `gas=${String(gas).padStart(12)} sp=${String(sp).padStart(3)}`,
    )
    prev = { gas, depth }
  }
  process.stdout.write('\n')
}

let pass = 0
let fail = 0
// A histogram of gas deltas points straight at a wrong constant: one recurring
// value is one bug, however many tests it breaks.
const gasDeltas = new Map<string, number>()
const reasons = new Map<string, number>()
const samples = new Map<string, string>()

outer: for (const file of walk(root)) {
  if (filter && !file.includes(filter)) continue
  let doc: any
  try {
    doc = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    continue
  }
  for (const [name, test] of Object.entries<any>(doc)) {
    for (const [fork, posts] of Object.entries<any[]>(test.post ?? {})) {
      if (onlyFork && fork !== onlyFork) continue
      for (const post of posts) {
        let outcome: Outcome
        if (traceCase) engine.evm_trace_reset?.(vm)
        try {
          outcome = runCase(test, fork, post)
        } catch (error) {
          outcome = {
            ok: false,
            reason: `threw:${(error as Error).message.slice(0, 40)}`,
          }
          instantiate()
        }
        if (process.env.CASES)
          console.log(`CASE ${outcome.ok ? 'PASS' : 'FAIL'} ${name}`)
        if (traceCase && name.includes(traceCase)) {
          console.log(`${name}\n  ${outcome.ok ? 'PASS' : `FAIL ${outcome.reason} ${outcome.detail ?? ''}`}`)
          dumpTrace()
          process.exit(0)
        }
        if (outcome.ok) pass++
        else {
          fail++
          reasons.set(outcome.reason, (reasons.get(outcome.reason) ?? 0) + 1)
          if (outcome.reason === 'balance' && outcome.detail) {
            const m = /gas-delta (-?\d+)/.exec(outcome.detail)
            const w = /wei-delta (-?\d+)/.exec(outcome.detail)
            // When the gas matches, the discrepancy is a value transfer, so
            // bucket those by wei instead.
            const key =
              m && m[1] !== '0' ? `gas ${m[1]}` : `wei ${w?.[1] ?? '?'}`
            gasDeltas.set(key, (gasDeltas.get(key) ?? 0) + 1)
            if (!samples.has(key))
              samples.set(key, `${name.slice(0, 100)}\n      ${outcome.detail}`)
          }
          if (!samples.has(outcome.reason))
            samples.set(
              outcome.reason,
              `${name.slice(0, 110)}${outcome.detail ? `\n      ${outcome.detail}` : ''}`,
            )
        }
        if (pass + fail >= limit) break outer
      }
    }
  }
}

const total = pass + fail
console.log(
  `\n${pass}/${total} passed (${((pass / total) * 100).toFixed(2)}%)  ${onlyFork ?? 'all forks'}\n`,
)
if (gasDeltas.size) {
  console.log('most common gas deltas (balance failures):')
  for (const [delta, count] of [...gasDeltas]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12))
    console.log(
      `${String(count).padStart(7)}  ${delta}${
        samples.has(delta) ? `\n         ${samples.get(delta)}` : ''
      }`,
    )
  console.log()
}
const ranked = [...reasons].sort((a, b) => b[1] - a[1])
for (const [reason, count] of ranked.slice(0, show))
  console.log(
    `${String(count).padStart(7)}  ${reason}\n         e.g. ${samples.get(reason)}`,
  )
