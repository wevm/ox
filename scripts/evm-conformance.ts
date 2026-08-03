// Runs the `ethereum/execution-spec-tests` fixtures against an Ox EVM engine.
//
//   node --import tsx scripts/evm-conformance.ts <fixtures/state_tests>
//     [--engine wasm|ts] [--fork Prague] [--limit N] [--filter substring]
//     [--show N] [--blockchain] [--trace-case substring] [--trace-tail N]
//
// Fixtures are pinned to release v5.4.0 (`fixtures_develop.tar.gz`) — the
// corpus the WASM engine was validated against (63554/63556 state tests;
// the two remaining are `static_Call1MB1024Calldepth`, an engine memory
// limit, not a semantic one). Download:
//
//   mkdir -p test/evm/fixtures && curl -sL \
//     https://github.com/ethereum/execution-spec-tests/releases/download/v5.4.0/fixtures_develop.tar.gz \
//     | tar -xz -C test/evm/fixtures --strip-components=1 fixtures/state_tests
//
// `--engine` picks the implementation behind the adapter seam:
//
// - `wasm` (default): the conformance-validated C→WASM engine.
// - `ts`: the pure-TypeScript `ox/evm` interpreter. Single-frame only until
//   the call family lands, so call/create-heavy cases fail with
//   `invalid-opcode` — the summary reports that gap rather than hiding it.
//   Forks below Cancun are skipped (the TS core implements Cancun→Osaka).
//
// The transaction layer lives in `test/evm/eest.ts` rather than in either
// engine: intrinsic gas, nonce and balance checks, the refund cap, and the
// coinbase payment are not hot, and keeping them out of the engines keeps
// the engines to executing frames.
//
// State tests carry an explicit expected post-state, so conformance is an
// account-by-account comparison and needs no Merkle-Patricia trie.
// `--blockchain` switches to the chain fixtures (`blockchain_tests`), which
// need block validation and a list trie for the withdrawals root.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import * as Hash from '../src/core/Hash.js'
import * as Rlp from '../src/core/Rlp.js'
import * as Opcode from '../src/evm/Opcode.js'
import * as eest from '../test/evm/eest.js'

type Hex = `0x${string}`

// A blockchain fixture is a chain of blocks rather than one transaction, but
// every one of them carries an explicit `postState`, so none of this needs a
// Merkle Patricia trie for the *state*: the state root in the header is never
// checked. What it does need is for one transaction's result to feed the
// next, and settlement happens in the runner, so the state is carried in the
// settled map rather than read back out of the engine.
//
// Each transaction is run by handing `runCase` a state test synthesised from
// the running state and the block's header. That reloads the whole state per
// transaction, which is wasteful and is also why no other part of the runner
// had to change.

type Header = {
  baseFeePerGas?: string | undefined
  blobGasUsed?: string | undefined
  coinbase: string
  difficulty?: string | undefined
  excessBlobGas?: string | undefined
  gasLimit: string
  gasUsed: string
  hash?: string | undefined
  mixHash?: string | undefined
  number: string
  parentBeaconBlockRoot?: string | undefined
  parentHash?: string | undefined
  requestsHash?: string | undefined
  timestamp: string
  withdrawalsRoot?: string | undefined
}

type Withdrawal = {
  address: string
  amount: string
  index: string
  validatorIndex: string
}

/** A block body transaction: the state-test shape with scalar data/gas/value. */
type BlockTransaction = Omit<
  eest.FixtureTransaction,
  'data' | 'gasLimit' | 'value'
> & { data: string; gasLimit: string; value: string }

type Block = {
  blockHeader?: Header | undefined
  expectException?: string | undefined
  rlp?: string | undefined
  rlp_decoded?:
    | {
        blockHeader?: Header | undefined
        transactions?: readonly BlockTransaction[] | undefined
        withdrawals?: readonly Withdrawal[] | undefined
      }
    | undefined
  transactions?: readonly BlockTransaction[] | undefined
  withdrawals?: readonly Withdrawal[] | undefined
}

type BlockchainFixture = {
  blocks?: readonly Block[] | undefined
  config?: eest.FixtureConfig | undefined
  genesisBlockHeader?: Header | undefined
  network: string
  postState?: Record<string, eest.FixtureAccount> | undefined
  pre: Record<string, eest.FixtureAccount>
}

const { big, bytes, forkAtLeast, toHex } = eest

/** The running state, in the shape `runCase` wants for a fixture's `pre`. */
function preFromSettled(
  settled: Map<string, eest.ReadAccount>,
  storage: Map<string, Map<bigint, bigint>>,
): Record<string, eest.FixtureAccount> {
  const pre: Record<string, eest.FixtureAccount> = {}
  for (const a of settled.values()) {
    const slots: Record<string, string> = {}
    for (const [k, v] of storage.get(a.address) ?? [])
      if (v !== 0n) slots[`0x${k.toString(16)}`] = `0x${v.toString(16)}`
    pre[a.address] = {
      balance: `0x${a.balance.toString(16)}`,
      code: a.code,
      nonce: `0x${a.nonce.toString(16)}`,
      storage: slots,
    }
  }
  return pre
}

/** The block reward paid to the coinbase, which the merge ended. */
function blockReward(fork: string): bigint {
  if (forkAtLeast(fork, 'Paris')) return 0n
  if (forkAtLeast(fork, 'Constantinople')) return 2_000_000_000_000_000_000n
  if (forkAtLeast(fork, 'Byzantium')) return 3_000_000_000_000_000_000n
  return 5_000_000_000_000_000_000n
}

function credit(
  pre: Record<string, eest.FixtureAccount>,
  addr: string,
  wei: bigint,
) {
  const key = addr.toLowerCase()
  const a = (pre[key] ??= {
    balance: '0x0',
    code: '0x',
    nonce: '0x0',
    storage: {},
  })
  a.balance = `0x${(big(a.balance) + wei).toString(16)}`
}

// The predeploys a block invokes outside any transaction. Each is an ordinary
// call from the system address with 30M gas, charged to nobody: no nonce bump
// and no gas accounting, which is why they cannot go through `runCase`.
const SYSTEM_ADDR = '0xfffffffffffffffffffffffffffffffffffffffe'
const BEACON_ROOTS = '0x000f3df6d732807ef1319fb7b8bb8522d0beac02'
const HISTORY_STORAGE = '0x0000f90827f1c53a10cb7a02335b175320002935'
const WITHDRAWAL_REQUESTS = '0x00000961ef480eb55e80d19ad83579a64c007002'
const CONSOLIDATION_REQUESTS = '0x0000bbddc7ce488642fb579f8b00f3a590007251'

/** Loads `pre` into the engine and sets the block context. */
function loadInto(
  adapter: eest.Adapter,
  pre: Record<string, eest.FixtureAccount>,
  env: eest.FixtureEnv,
  fork: string,
  config: eest.FixtureConfig | undefined,
  chainHashes: readonly bigint[],
): boolean {
  adapter.reset()
  try {
    for (const [addr, acct] of Object.entries(pre)) {
      adapter.putAccount(addr, {
        balance: big(acct.balance),
        code: bytes(acct.code),
        nonce: big(acct.nonce),
      })
      for (const [k, v] of Object.entries(acct.storage ?? {}))
        adapter.putStorage(addr, big(k), big(v))
    }
  } catch {
    return false
  }
  adapter.setContext({
    baseFee: big(env.currentBaseFee),
    blobBaseFee: 0n,
    blobHashes: [],
    chainHashes,
    chainId: big(config?.chainid ?? '0x01'),
    coinbase: env.currentCoinbase,
    fork,
    gasLimit: big(env.currentGasLimit),
    gasPrice: 0n,
    number: big(env.currentNumber),
    origin: SYSTEM_ADDR,
    prevRandao: big(env.currentRandom ?? env.currentDifficulty),
    timestamp: big(env.currentTimestamp),
  })
  return true
}

/**
 * One predeploy call, if the contract is deployed. Returns the state after.
 *
 * A call to an address with no code is a no-op that still touches the
 * account, so an absent predeploy is skipped rather than called into.
 */
function systemCall(
  adapter: eest.Adapter,
  pre: Record<string, eest.FixtureAccount>,
  env: eest.FixtureEnv,
  fork: string,
  config: eest.FixtureConfig | undefined,
  chainHashes: readonly bigint[],
  to: string,
  data: Uint8Array,
  requirePresent: boolean,
): {
  failed: boolean
  output: Uint8Array
  pre: Record<string, eest.FixtureAccount>
} {
  const acct = pre[to]
  // Absence and failure are different. EIP-7002 and EIP-7251 require their
  // predeploy to exist — the chain is invalid without it. EIP-4788 and
  // EIP-2935 tolerate absence and skip the call, which is what lets a chain
  // deploy the history contract partway through and stay valid. A call that
  // *halts* is invalid either way.
  const none = new Uint8Array()
  if (!acct || !acct.code || acct.code === '0x')
    return { failed: requirePresent, output: none, pre }
  if (!loadInto(adapter, pre, env, fork, config, chainHashes))
    return { failed: false, output: none, pre }
  const status = adapter.execute({
    address: to,
    caller: SYSTEM_ADDR,
    data,
    gas: 30_000_000n,
    value: 0n,
  })
  const settled = new Map(adapter.readState().map((a) => [a.address, a]))
  return {
    failed: status !== 'success',
    output: adapter.output(),
    pre: preFromSettled(settled, adapter.readStorage()),
  }
}

// Only enough of one to compute a root over a list keyed by its index, which
// is what the withdrawals, transactions and receipts roots all are. There is
// no storage, no lookup and no proof: a root is a pure function of the pairs,
// so the trie is built and hashed in one pass and thrown away.

/** keccak of the RLP of the empty string — the root of an empty trie. */
const EMPTY_ROOT =
  '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'

/**
 * Hex-prefix encoding: the path, packed two nibbles to a byte, behind a flag
 * nibble carrying the node kind and the parity.
 *
 * The parity matters because a path of odd length cannot be packed without a
 * spare nibble, and the flag byte donates it.
 */
function hpEncode(nibbles: number[], leaf: boolean): Uint8Array {
  const odd = nibbles.length % 2 === 1
  const out = [((leaf ? 2 : 0) + (odd ? 1 : 0)) << 4]
  if (odd) out[0] = (out[0] as number) | (nibbles[0] as number)
  for (let i = odd ? 1 : 0; i < nibbles.length; i += 2)
    out.push(((nibbles[i] as number) << 4) | (nibbles[i + 1] as number))
  return Uint8Array.from(out)
}

type Node = Uint8Array | Node[]

/**
 * How a parent refers to a child: inline when the child's encoding is under
 * 32 bytes, by hash otherwise. This is the rule that makes the root depend on
 * node *sizes* and not only on the key set.
 */
function trieRef(node: Node): Node {
  const encoded = Rlp.fromBytes(node, { as: 'Bytes' })
  return encoded.length < 32 ? node : bytes(Hash.keccak256(toHex(encoded)))
}

function trieNode(pairs: { key: number[]; value: Uint8Array }[]): Node {
  if (pairs.length === 1) {
    const only = pairs[0] as { key: number[]; value: Uint8Array }
    return [hpEncode(only.key, true), only.value]
  }
  // The longest prefix every key shares becomes an extension node.
  const first = (pairs[0] as { key: number[] }).key
  let common = 0
  while (
    common < first.length &&
    pairs.every((p) => p.key.length > common && p.key[common] === first[common])
  )
    common++
  if (common > 0)
    return [
      hpEncode(first.slice(0, common), false),
      trieRef(trieNode(pairs.map((p) => ({ ...p, key: p.key.slice(common) })))),
    ]
  const branch: Node = Array.from({ length: 17 }, () => new Uint8Array())
  for (let nib = 0; nib < 16; nib++) {
    const below = pairs.filter((p) => p.key[0] === nib)
    if (below.length)
      branch[nib] = trieRef(
        trieNode(below.map((p) => ({ ...p, key: p.key.slice(1) }))),
      )
  }
  // A key that ends here rather than descending sits in the seventeenth slot.
  const here = pairs.find((p) => p.key.length === 0)
  if (here) branch[16] = here.value
  return branch
}

/** The root over `values`, keyed by `RLP(index)` as every list trie is. */
function listRoot(values: Uint8Array[]): Hex {
  if (values.length === 0) return EMPTY_ROOT
  const pairs = values.map((value, i) => {
    const key = Rlp.fromBytes(minimalBytes(BigInt(i)), { as: 'Bytes' })
    const nibbles: number[] = []
    for (const b of key) nibbles.push(b >> 4, b & 0xf)
    return { key: nibbles, value }
  })
  return Hash.keccak256(toHex(Rlp.fromBytes(trieNode(pairs), { as: 'Bytes' })))
}

/** A scalar as the shortest big-endian byte string, which is how RLP wants
 * it. */
function minimalBytes(v: bigint): Uint8Array {
  if (v === 0n) return new Uint8Array()
  let hex = v.toString(16)
  if (hex.length % 2) hex = `0${hex}`
  return bytes(`0x${hex}`)
}

// EIP-6110's deposit contract, and the canonical ABI layout of its event:
// five dynamic `bytes` fields, so five offsets followed by five
// length-prefixed padded bodies. The offsets and lengths are fixed by the
// field sizes, and a log that does not match them exactly is what
// INVALID_DEPOSIT_EVENT_LAYOUT means — the consensus layer parses this by
// position, not by decoding.
const DEPOSIT_CONTRACT = '0x00000000219ab540356cbb839cbe05303d7705fa'
// keccak of `DepositEvent(bytes,bytes,bytes,bytes,bytes)`. The contract emits
// other logs, and one of those is not a malformed deposit — it is not a
// deposit at all.
const DEPOSIT_EVENT_TOPIC =
  '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'
const DEPOSIT_EVENT_LAYOUT = [
  { length: 48, offset: 0xa0 }, // pubkey
  { length: 32, offset: 0x100 }, // withdrawal credentials
  { length: 8, offset: 0x140 }, // amount
  { length: 96, offset: 0x180 }, // signature
  { length: 8, offset: 0x200 }, // index
]
const DEPOSIT_EVENT_SIZE = 576

/**
 * The 192-byte deposit request a log encodes, or null if its layout is wrong.
 *
 * The fields are concatenated unpadded, in declaration order, which is not
 * what the ABI encoding holds — hence reading each body out of its own slot
 * rather than decoding.
 */
function depositRequest(data: Uint8Array): Uint8Array | null {
  if (data.length !== DEPOSIT_EVENT_SIZE) return null
  const word = (at: number) => {
    let v = 0n
    for (let i = 0; i < 32; i++) v = (v << 8n) | BigInt(data[at + i] as number)
    return v
  }
  const parts: Uint8Array[] = []
  for (const { length, offset } of DEPOSIT_EVENT_LAYOUT) {
    if (word(parts.length * 32) !== BigInt(offset)) return null
    if (word(offset) !== BigInt(length)) return null
    parts.push(data.slice(offset + 32, offset + 32 + length))
  }
  const out = new Uint8Array(192)
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/**
 * EIP-7685: `sha256` over the `sha256` of each non-empty `type || data`.
 *
 * The three lists are deposits scraped from the block's logs, and the raw
 * output of the EIP-7002 and EIP-7251 predeploy calls.
 */
function requestsHashOf(lists: (Uint8Array | null)[]): Hex {
  const digests: number[] = []
  for (let type = 0; type < lists.length; type++) {
    const body = lists[type]
    if (!body || body.length === 0) continue
    const framed = new Uint8Array(1 + body.length)
    framed[0] = type
    framed.set(body, 1)
    digests.push(...bytes(Hash.sha256(toHex(framed))))
  }
  return Hash.sha256(toHex(Uint8Array.from(digests)))
}

type ParentInfo = {
  baseFeePerGas: bigint
  blobGasUsed: bigint
  excessBlobGas: bigint
  fork: string
  gasLimit: bigint
  gasUsed: bigint
  hasBaseFee: boolean
}

/**
 * Header checks that need only the header and its parent.
 *
 * Everything here is arithmetic on fields the fixture already decodes, so
 * none of it needs a trie. What is deliberately *not* here is anything rooted
 * in one: the receipts root, and the block hash (`keccak(RLP(header))` —
 * checking it would need a header encoder, for twelve tests).
 *
 * Over-rejection is the danger — a rule slightly too strict quietly discards
 * valid blocks — so the caller treats a rejection of a block with no
 * `expectException` as a failure rather than letting it pass silently.
 */
function headerInvalid(
  h: Header,
  parent: ParentInfo | undefined,
  fork: string,
  b: Block,
  transition: boolean,
): boolean {
  const gasLimit = big(h.gasLimit)
  // The floor and the 1/1024 band, unchanged since Frontier.
  if (gasLimit < 5000n) return true
  if (big(h.gasUsed) > gasLimit) return true
  if (parent && !transition) {
    const pl = parent.gasLimit
    const diff = gasLimit > pl ? gasLimit - pl : pl - gasLimit
    if (diff >= pl / 1024n) return true
  }
  // EIP-7934 caps the encoded block from Osaka at `MAX_BLOCK_SIZE` less a
  // `SAFETY_MARGIN` — 10 MiB less 2 MiB, so 8 MiB, not the 10 the headline
  // number suggests.
  if (forkAtLeast(fork, 'Osaka') && b.rlp && (b.rlp.length - 2) / 2 > 8_388_608)
    return true
  // Every fork that added a header field made it mandatory from that block
  // and forbidden before it, so presence is as much a consensus rule as value
  // — which is what INCORRECT_BLOCK_FORMAT means. `parentBeaconBlockRoot` is
  // excluded: the fixtures omit it on blocks they still expect to be valid.
  for (const [field, since] of [
    ['baseFeePerGas', 'London'],
    ['withdrawalsRoot', 'Shanghai'],
    ['blobGasUsed', 'Cancun'],
    ['excessBlobGas', 'Cancun'],
    ['requestsHash', 'Prague'],
  ] as const)
    if ((h[field] !== undefined) !== forkAtLeast(fork, since)) return true

  // EIP-1559's base fee, which is a function of how full the parent was.
  // Skipped where the parent has none: that is the London transition block,
  // whose base fee is the initial constant rather than a step from anything.
  if (h.baseFeePerGas !== undefined && parent?.hasBaseFee) {
    const target = parent.gasLimit / 2n // ELASTICITY_MULTIPLIER
    const base = parent.baseFeePerGas
    let want = base
    if (target > 0n && parent.gasUsed > target) {
      const delta = (base * (parent.gasUsed - target)) / target / 8n
      want = base + (delta > 1n ? delta : 1n)
    } else if (target > 0n && parent.gasUsed < target) {
      want = base - (base * (target - parent.gasUsed)) / target / 8n
    }
    if (big(h.baseFeePerGas) !== want) return true
  }

  // EIP-4895's withdrawals root. A withdrawal is `RLP([index,
  // validatorIndex, address, amount])` and the trie is keyed by position, so
  // this needs only the list the fixture already gives.
  if (h.withdrawalsRoot !== undefined) {
    const encoded = (b.withdrawals ?? b.rlp_decoded?.withdrawals ?? []).map(
      (w) =>
        Rlp.fromBytes(
          [
            minimalBytes(big(w.index)),
            minimalBytes(big(w.validatorIndex)),
            bytes(w.address),
            minimalBytes(big(w.amount)),
          ],
          { as: 'Bytes' },
        ),
    )
    if (listRoot(encoded) !== h.withdrawalsRoot.toLowerCase()) return true
  }

  return false
}

/**
 * Runs one blockchain fixture and compares its `postState`.
 *
 * Blocks whose RLP encoding is itself what is under test carry no decoded
 * header, so there is nothing to check them against; those are reported as
 * skipped.
 */
function runBlockchainTest(
  adapter: eest.Adapter,
  t: BlockchainFixture,
): eest.Outcome {
  // A transition network names two forks and the timestamp the second takes
  // effect at, so the fork is a property of the block rather than the test.
  const transition = /^(\w+)To(\w+)AtTime(\d+)k$/.exec(t.network)
  const forkAt = (timestamp: bigint): string =>
    transition
      ? timestamp >= BigInt(transition[3] as string) * 1000n
        ? (transition[2] as string)
        : (transition[1] as string)
      : t.network
  let fork: string = forkAt(0n)
  if (!adapter.supports(fork)) return { ok: false, reason: `fork:${fork}` }
  let pre: Record<string, eest.FixtureAccount> = t.pre
  // Nearest ancestor first, starting from the genesis header the fixture
  // carries; BLOCKHASH indexes back from the current block.
  let chainHashes: bigint[] = t.genesisBlockHeader?.hash
    ? [big(t.genesisBlockHeader.hash)]
    : []
  const headerOf = (
    x: Header | undefined,
    fork: string,
  ): ParentInfo | undefined =>
    x
      ? {
          baseFeePerGas: big(x.baseFeePerGas),
          blobGasUsed: big(x.blobGasUsed),
          excessBlobGas: big(x.excessBlobGas),
          fork,
          gasLimit: big(x.gasLimit),
          gasUsed: big(x.gasUsed),
          hasBaseFee: x.baseFeePerGas !== undefined,
        }
      : undefined
  // The excess is defined against the previous block, so the genesis header
  // seeds it.
  let parent = headerOf(
    t.genesisBlockHeader,
    forkAt(big(t.genesisBlockHeader?.timestamp)),
  )
  let settled: Map<string, eest.ReadAccount> | undefined
  for (const b of t.blocks ?? []) {
    // A block the chain must reject. Where the reason is a transaction, the
    // runner already decides that — it is the same set of validity rules a
    // state test exercises — so the block can be run and the verdict read off
    // the case result. A `BlockException` is a property of the header; the
    // decidable ones are checked in `headerInvalid`.
    const expected: string = b.expectException ?? ''
    const h = b.blockHeader ?? b.rlp_decoded?.blockHeader
    // An RLP-only block is one whose encoding is itself what is wrong, so
    // there is nothing decoded to check.
    if (!h) return { ok: false, reason: 'skip:undecodable-block' }
    fork = forkAt(big(h.timestamp))
    if (!adapter.supports(fork)) return { ok: false, reason: `fork:${fork}` }
    const env: eest.FixtureEnv = {
      currentBaseFee: h.baseFeePerGas ?? '0x0',
      currentCoinbase: h.coinbase,
      currentDifficulty: h.difficulty,
      currentExcessBlobGas: h.excessBlobGas ?? '0x0',
      currentGasLimit: h.gasLimit,
      currentNumber: h.number,
      // Only from the merge. A pre-merge header still has a `mixHash`, and
      // passing it as the random would shadow `difficulty`, which is what
      // opcode 0x44 still means before Paris.
      currentRandom: forkAtLeast(fork, 'Paris') ? h.mixHash : undefined,
      currentTimestamp: h.timestamp,
    }
    // An invalid block leaves the chain where it was, so everything it does
    // is discarded — the predeploy calls below included, which is why the
    // snapshot is taken before them and not just before the transactions.
    const before = pre
    // Declared before the predeploy calls below, which report into it.
    let rejected = false
    // EIP-4788 and EIP-2935 run before the block's transactions.
    const sys = (to: string, data: Uint8Array, required: boolean) => {
      const r = systemCall(
        adapter,
        pre,
        env,
        fork,
        t.config,
        chainHashes,
        to,
        data,
        required,
      )
      pre = r.pre
      if (r.failed) rejected = true
      return r.output
    }
    // Deposits are scraped from the block's logs as its transactions run.
    const deposits: number[] = []
    let badDepositLog = false
    if (forkAtLeast(fork, 'Cancun') && h.parentBeaconBlockRoot !== undefined)
      sys(BEACON_ROOTS, bytes(h.parentBeaconBlockRoot), false)
    if (forkAtLeast(fork, 'Prague'))
      sys(HISTORY_STORAGE, bytes(h.parentHash), false)
    // The blob limit is per *block* as well as per transaction, and no single
    // transaction can see the total, so it is summed here. A block over the
    // schedule's maximum is invalid however valid each transaction is on its
    // own.
    const txs = b.transactions ?? b.rlp_decoded?.transactions ?? []
    const blobTotal = txs.reduce(
      (n, tx) => n + (tx.blobVersionedHashes?.length ?? 0),
      0,
    )
    const scheduledMax = t.config?.blobSchedule?.[fork]?.max
    const blockMaxBlobs =
      scheduledMax !== undefined
        ? Number(big(scheduledMax))
        : forkAtLeast(fork, 'Prague')
          ? 9
          : 6
    if (blobTotal > blockMaxBlobs) rejected = true
    // A transition block's gas limit is allowed to jump — London doubled it —
    // so the 1/1024 band is not applied across one.
    const transitionBlock = parent !== undefined && parent.fork !== fork
    if (headerInvalid(h, parent, fork, b, transitionBlock)) rejected = true

    // The blob fields of the header are a pure function of the block's blobs
    // and its parent, so they can be checked without any of the rest of the
    // header. Validating them is also the only place EIP-7918 is observable —
    // the excess is computed from the parent, never by the engine.
    if (forkAtLeast(fork, 'Cancun') && h.blobGasUsed !== undefined) {
      const schedule = t.config?.blobSchedule?.[fork]
      const usedWant = eest.gasPerBlob * BigInt(blobTotal)
      if (big(h.blobGasUsed) !== usedWant) rejected = true
      if (usedWant > eest.gasPerBlob * BigInt(blockMaxBlobs)) rejected = true
      if (parent && h.excessBlobGas !== undefined) {
        const want = eest.calcExcessBlobGas(parent, fork, schedule)
        if (big(h.excessBlobGas) !== want) rejected = true
      }
    }
    let gasUsed = 0n
    for (const tx of rejected ? [] : txs) {
      if (big(tx.gasLimit) > big(h.gasLimit) - gasUsed) {
        rejected = true
        break
      }
      const synthetic: eest.FixtureCase = {
        config: t.config,
        env,
        pre,
        transaction: {
          ...tx,
          data: [tx.data],
          gasLimit: [tx.gasLimit],
          value: [tx.value],
        },
      }
      const result = eest.runCase(
        adapter,
        synthetic,
        fork,
        { indexes: { data: 0, gas: 0, value: 0 } },
        { chainHashes },
      )
      if (!result.outcome.ok && !expected) return result.outcome
      rejected = rejected || result.rejected
      if (result.rejected) break
      gasUsed += result.gasUsed
      if (forkAtLeast(fork, 'Prague') && !result.rejected)
        for (const log of adapter.readLogs()) {
          if (log.address !== DEPOSIT_CONTRACT) continue
          if (log.topics[0] !== DEPOSIT_EVENT_TOPIC) continue
          const req = depositRequest(log.data)
          if (!req) badDepositLog = true
          else deposits.push(...req)
        }
      settled = result.settled
      pre = preFromSettled(settled, adapter.readStorage())
    }
    // EIP-7002 and EIP-7251 dequeue their request lists after the
    // transactions, and their output is two thirds of the requests hash. This
    // has to run before the verdict below: for an invalid block the hash is
    // often the very thing that is wrong.
    if (forkAtLeast(fork, 'Prague')) {
      const withdrawals = sys(WITHDRAWAL_REQUESTS, new Uint8Array(), true)
      const consolidations = sys(CONSOLIDATION_REQUESTS, new Uint8Array(), true)
      if (badDepositLog) rejected = true
      else if (h.requestsHash !== undefined) {
        const want = requestsHashOf([
          Uint8Array.from(deposits),
          withdrawals,
          consolidations,
        ])
        if (want !== h.requestsHash.toLowerCase()) rejected = true
      }
    }
    if (!expected && rejected)
      return { ok: false, reason: 'rejected-valid-block' }
    if (expected) {
      // `continue` skips the parent update below too: a rejected block is
      // never the parent of the next one.
      pre = before
      if (!rejected)
        return { detail: expected, ok: false, reason: 'accepted-invalid-block' }
      continue
    }
    // Withdrawals are denominated in gwei, unlike everything else here.
    for (const w of b.withdrawals ?? b.rlp_decoded?.withdrawals ?? [])
      credit(pre, w.address, big(w.amount) * 1_000_000_000n)
    const reward = blockReward(fork)
    if (reward > 0n) credit(pre, h.coinbase, reward)
    if (h.hash) chainHashes.unshift(big(h.hash))
    parent = headerOf(h, fork)
  }
  // Load the final state back so `compare` reads it from the engine, which is
  // the only path that also produces storage. A transaction that cannot pay
  // its intrinsic gas is rejected before it runs, which loads the state and
  // compares without touching it.
  const result = eest.runCase(
    adapter,
    {
      config: t.config,
      env: {
        currentBaseFee: '0x0',
        currentCoinbase: '0x0000000000000000000000000000000000000000',
        currentGasLimit: '0x1',
        currentNumber: '0x1',
        currentTimestamp: '0x1',
      },
      pre,
      transaction: {
        data: ['0x'],
        gasLimit: ['0x0'],
        gasPrice: '0x0',
        nonce: '0x0',
        sender: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000000',
        value: ['0x0'],
      },
    },
    fork,
    { indexes: { data: 0, gas: 0, value: 0 }, state: t.postState ?? {} },
  )
  return result.outcome
}

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
  console.error(
    'usage: evm-conformance.ts <fixtures/state_tests> [--engine wasm|ts] [options]',
  )
  process.exit(2)
}
const opt = (name: string) => {
  const i = args.indexOf(name)
  return i < 0 ? undefined : args[i + 1]
}
const engineName = opt('--engine') ?? 'wasm'
if (engineName !== 'wasm' && engineName !== 'ts')
  throw new Error(`unknown engine: ${engineName}`)
const adapter = engineName === 'ts' ? eest.ts() : eest.wasm()
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
const blockchain = args.includes('--blockchain')
const traceCase = opt('--trace-case')
if (traceCase && !adapter.trace)
  throw new Error('--trace-case needs OX_WASM pointing at a --trace build')

function dumpTrace() {
  const trace = adapter.trace
  if (!trace) return
  const { at, capacity, total } = trace.read()
  // The buffer is a ring, so a long program leaves only its tail.
  // `--trace-tail N` narrows that further; the default is the whole ring.
  const tail = Number(opt('--trace-tail') ?? capacity)
  const first = Math.max(0, total - Math.min(tail, capacity))
  const n = total - first
  console.log(
    `\n${total} steps, showing the last ${n}  (pc, op, gas before, cost, depth, stack height)`,
  )
  let prev: { depth: number; gas: bigint } | undefined
  for (let i = 0; i < n; i++) {
    const step = at(first + i)
    // The cost of the *previous* instruction, which is the interesting
    // column; it is only meaningful within one frame.
    const cost =
      prev && prev.depth === step.depth
        ? String(prev.gas - step.gas).padStart(8)
        : '        '
    if (i > 0) process.stdout.write(`${cost}\n`)
    process.stdout.write(
      `${String(first + i).padStart(8)}  d${step.depth} pc=${String(step.pc).padStart(5)} ` +
        `${Opcode.toName(step.op) ?? `0x${step.op.toString(16)}`}`.padEnd(22) +
        `gas=${String(step.gas).padStart(12)} sp=${String(step.sp).padStart(3)}`,
    )
    prev = { depth: step.depth, gas: step.gas }
  }
  process.stdout.write('\n')
}

let pass = 0
let fail = 0
let skip = 0
// A histogram of gas deltas points straight at a wrong constant: one
// recurring value is one bug, however many tests it breaks.
const gasDeltas = new Map<string, number>()
const reasons = new Map<string, number>()
const samples = new Map<string, string>()
const skippedForks = new Map<string, number>()
// Per-fork pass/fail tallies — the release gate is a per-fork table, and one
// aggregate number hides a fork whose gate regressed.
const byFork = new Map<string, { fail: number; pass: number }>()

function record(outcome: eest.Outcome, name: string, fork?: string) {
  if (fork) {
    const tally = byFork.get(fork) ?? { fail: 0, pass: 0 }
    if (outcome.ok) tally.pass++
    else tally.fail++
    byFork.set(fork, tally)
  }
  if (outcome.ok) {
    pass++
    return
  }
  fail++
  reasons.set(outcome.reason, (reasons.get(outcome.reason) ?? 0) + 1)
  if (outcome.reason === 'balance' && outcome.detail) {
    const m = /gas-delta (-?\d+)/.exec(outcome.detail)
    const w = /wei-delta (-?\d+)/.exec(outcome.detail)
    // When the gas matches, the discrepancy is a value transfer, so bucket
    // those by wei instead.
    const key = m && m[1] !== '0' ? `gas ${m[1]}` : `wei ${w?.[1] ?? '?'}`
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

outer: for (const file of walk(root)) {
  if (filter && !file.includes(filter)) continue
  const doc = (() => {
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    } catch {
      return undefined
    }
  })()
  if (!doc) continue
  for (const [name, test] of Object.entries(doc)) {
    // `--blockchain` switches to the chain fixtures, whose shape is a list of
    // blocks and one `postState` rather than a `post` keyed by fork.
    if (blockchain) {
      const outcome = (() => {
        try {
          return runBlockchainTest(adapter, test as BlockchainFixture)
        } catch (error) {
          adapter.recover()
          // `DEBUG=1` surfaces the stack — a `threw:` reason names the
          // symptom, not the line.
          if (process.env.DEBUG) console.log((error as Error).stack)
          return {
            ok: false as const,
            reason: `threw:${(error as Error).message.slice(0, 40)}`,
          }
        }
      })()
      if (process.env.CASES)
        console.log(`CASE ${outcome.ok ? 'PASS' : 'FAIL'} ${name}`)
      record(outcome, name)
      if (pass + fail >= limit) break outer
      continue
    }
    const case_ = test as eest.FixtureCase
    for (const [fork, posts] of Object.entries(case_.post ?? {})) {
      if (onlyFork && fork !== onlyFork) continue
      if (!adapter.supports(fork)) {
        skip += posts.length
        skippedForks.set(fork, (skippedForks.get(fork) ?? 0) + posts.length)
        continue
      }
      for (const post of posts) {
        if (traceCase) adapter.trace?.reset()
        const outcome = (() => {
          try {
            return eest.runCase(adapter, case_, fork, post).outcome
          } catch (error) {
            adapter.recover()
            if (process.env.DEBUG) console.log((error as Error).stack)
            return {
              ok: false as const,
              reason: `threw:${(error as Error).message.slice(0, 40)}`,
            }
          }
        })()
        if (process.env.CASES)
          console.log(`CASE ${outcome.ok ? 'PASS' : 'FAIL'} ${name}`)
        if (traceCase && name.includes(traceCase)) {
          console.log(
            `${name}\n  ${outcome.ok ? 'PASS' : `FAIL ${outcome.reason} ${!outcome.ok && outcome.detail ? outcome.detail : ''}`}`,
          )
          dumpTrace()
          process.exit(0)
        }
        record(outcome, name, fork)
        if (pass + fail >= limit) break outer
      }
    }
  }
}

const total = pass + fail
console.log(
  `\n[${engineName}] ${pass}/${total} passed (${total ? ((pass / total) * 100).toFixed(2) : '0.00'}%)  ${onlyFork ?? 'all forks'}${
    skip ? `  — ${skip} skipped (unsupported forks)` : ''
  }\n`,
)
if (skippedForks.size) {
  const parts = [...skippedForks].map(([fork, count]) => `${fork}: ${count}`)
  console.log(`skipped by fork: ${parts.join(', ')}\n`)
}
if (byFork.size > 1) {
  for (const [fork, tally] of [...byFork].sort((a, b) =>
    a[0].localeCompare(b[0]),
  ))
    console.log(
      `${fork.padEnd(20)} ${String(tally.pass).padStart(7)}/${tally.pass + tally.fail} (${((tally.pass / (tally.pass + tally.fail)) * 100).toFixed(2)}%)`,
    )
  console.log()
}
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
if (fail > 0) process.exitCode = 1
