/**
 * Benchmarks across Ox's default, Node, and WASM implementations.
 *
 * Each Ox provider runs through the same core resolver, so the timings include
 * identical engine-dispatch overhead. Missing provider primitives report
 * `n/a`; they never time Ox's fallback under another engine's name.
 *
 * C is a native reference, not an Ox engine. It compiles every implementation
 * supplied by `ox/wasm` from the same sources and target defines for the host.
 * It is excluded from the fastest-Ox-engine calculation.
 * `OX_BENCH_WARMUP_MS`, `OX_BENCH_BUDGET_MS`, and `OX_BENCH_REPEATS` can
 * shorten local validation runs without changing the measured cases.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as CoreEngine from '../src/core/Engine.js'
import * as bls from '../src/core/internal/bls.js'
import * as ed25519 from '../src/core/internal/ed25519.js'
import * as engineContract from '../src/core/internal/engine.js'
import * as hash from '../src/core/internal/hash.js'
import * as keystore from '../src/core/internal/keystore.js'
import * as mlDsa44 from '../src/core/internal/mlDsa44.js'
import * as mnemonic from '../src/core/internal/mnemonic.js'
import * as p256 from '../src/core/internal/p256.js'
import * as secp256k1 from '../src/core/internal/secp256k1.js'
import * as x25519 from '../src/core/internal/x25519.js'
import { engine as nodeEngine } from '../src/node/Engine.js'
import { engine as wasmEngine } from '../src/wasm/Engine.js'
import { engine as wasmKeystoreEngine } from '../src/wasm/Keystore.js'
import { engine as wasmMlDsa44Engine } from '../src/wasm/MlDsa44.js'
import { engine as wasmSecp256k1Engine } from '../src/wasm/Secp256k1.js'
import { type Target, targets as wasmTargets } from '../wasm/targets.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const warmupMs = Number(process.env.OX_BENCH_WARMUP_MS ?? 200)
const budgetMs = Number(process.env.OX_BENCH_BUDGET_MS ?? 900)
const repeats = Number(process.env.OX_BENCH_REPEATS ?? 3)

if (
  !Number.isFinite(warmupMs) ||
  warmupMs < 0 ||
  !Number.isFinite(budgetMs) ||
  budgetMs <= 0 ||
  !Number.isInteger(repeats) ||
  repeats < 1
)
  throw new Error('Benchmark timing options must be finite positive numbers.')

type BenchmarkBase = {
  batch?: number | undefined
  case: string
  cKey?: string | undefined
  primitive: string
  slot: keyof CoreEngine.Engine
}

type SyncBenchmark = BenchmarkBase & {
  async?: false | undefined
  run: () => unknown
}

type AsyncBenchmark = BenchmarkBase & {
  async: true
  run: () => Promise<unknown>
}

type Benchmark = SyncBenchmark | AsyncBenchmark

const benchmarks: Benchmark[] = []

function sync(
  slot: keyof CoreEngine.Engine,
  primitive: string,
  case_: string,
  run: () => unknown,
  options: Pick<BenchmarkBase, 'batch' | 'cKey'> = {},
) {
  benchmarks.push({ ...options, case: case_, primitive, run, slot })
}

function async_(
  slot: keyof CoreEngine.Engine,
  primitive: string,
  case_: string,
  run: () => Promise<unknown>,
) {
  benchmarks.push({ async: true, case: case_, primitive, run, slot })
}

let sink: unknown

/**
 * Nanoseconds per synchronous call, using the best-observed repeat.
 *
 * This favors peak throughput and avoids presenting the result as a latency
 * distribution.
 */
function measureSync(run: () => unknown, batch = 32) {
  let best = Number.POSITIVE_INFINITY
  for (let repeat = 0; repeat < repeats; repeat++) {
    const warmup = performance.now()
    while (performance.now() - warmup < warmupMs) sink = run()
    let iters = 0
    const start = performance.now()
    do {
      for (let i = 0; i < batch; i++) sink = run()
      iters += batch
    } while (performance.now() - start < budgetMs)
    best = Math.min(best, ((performance.now() - start) * 1e6) / iters)
  }
  return best
}

/**
 * Nanoseconds per asynchronous call, using the best-observed repeat.
 *
 * Calls run sequentially so the result measures one contract invocation rather
 * than provider-specific concurrency.
 */
async function measureAsync(run: () => Promise<unknown>) {
  let best = Number.POSITIVE_INFINITY
  for (let repeat = 0; repeat < repeats; repeat++) {
    const warmup = performance.now()
    while (performance.now() - warmup < warmupMs) sink = await run()
    let iters = 0
    const start = performance.now()
    do {
      sink = await run()
      iters++
    } while (performance.now() - start < budgetMs)
    best = Math.min(best, ((performance.now() - start) * 1e6) / iters)
  }
  return best
}

async function measure(benchmark: Benchmark, engine?: CoreEngine.Engine) {
  CoreEngine.reset()
  if (engine) CoreEngine.set(engine)
  try {
    if (benchmark.async) return await measureAsync(benchmark.run)
    return measureSync(benchmark.run, benchmark.batch)
  } finally {
    CoreEngine.reset()
  }
}

function supports(engine: CoreEngine.Engine, benchmark: Benchmark) {
  const slot = engine[benchmark.slot] as Record<string, unknown> | undefined
  return typeof slot?.[benchmark.primitive] === 'function'
}

const cTargetNames = new Set([
  'blake3',
  'crypto25519',
  'hashes',
  'mldsa44',
  'scrypt',
  'secp256k1',
])
const cSourceOverrides = {
  'wasm/src/blake3.c': 'bench/native/blake3.c',
  'wasm/src/crypto25519.c': 'bench/native/crypto25519.c',
  'wasm/src/hashes.c': 'bench/native/hashes.c',
  'wasm/src/mldsa44.c': 'bench/native/mldsa44.c',
  'wasm/src/ox_rt.c': 'bench/native/runtime.c',
  'wasm/src/scrypt.c': 'bench/native/scrypt.c',
  'wasm/src/secp256k1.c': 'bench/native/secp256k1.c',
} as const
const cTargets: readonly Target[] = wasmTargets.filter((target) =>
  cTargetNames.has(target.name),
)

/** Native C rows, or `undefined` where a C compiler is unavailable. */
function c() {
  const directory = mkdtempSync(join(tmpdir(), 'ox-bench-native-'))
  const binary = join(directory, 'bench')
  const defines = cTargets.flatMap((target) =>
    Object.entries(target.defines ?? {}).map(
      ([key, value]) => `-D${key}=${value}`,
    ),
  )
  const includes = [
    '-Iwasm/src',
    ...cTargets.flatMap((target) =>
      (target.includes ?? []).map((include) => `-I${include}`),
    ),
  ]
  const sources = cTargets
    .flatMap((target) => target.sources)
    .map(
      (source) =>
        cSourceOverrides[source as keyof typeof cSourceOverrides] ?? source,
    )
  try {
    execFileSync(
      process.env.CC ?? 'cc',
      [
        '-std=c11',
        '-O3',
        '-fno-builtin',
        '-Wno-unused-function',
        '-DOX_RT_HOST',
        // wasm32 does not auto-detect host SIMD. Keep the native reference on
        // the same portable BLAKE3 path.
        '-DBLAKE3_USE_NEON=0',
        ...defines,
        ...includes,
        ...cTargets.flatMap((target) => target.cflags ?? []),
        'bench/native/bench.c',
        ...new Set(sources),
        '-o',
        binary,
      ],
      {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    )
    const stdout = execFileSync(binary, {
      encoding: 'utf8',
      env: {
        ...process.env,
        OX_BENCH_BUDGET_MS: String(budgetMs),
        OX_BENCH_REPEATS: String(repeats),
        OX_BENCH_WARMUP_MS: String(warmupMs),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const rows = new Map<string, number>()
    for (const line of stdout.trim().split('\n').slice(1)) {
      const [primitive, size, ns] = line.split(',') as [string, string, string]
      rows.set(`${primitive}:${size}`, Number(ns))
    }
    return rows
  } catch (error) {
    const reason = (error as { stderr?: string }).stderr
      ?.trim()
      .split('\n')
      .pop()
    console.log(`C unavailable: ${reason ?? 'a C compiler is not available'}\n`)
    return undefined
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

const format = (ns: number) =>
  ns >= 1e6
    ? `${(ns / 1e6).toFixed(2)} ms`
    : ns >= 1e3
      ? `${(ns / 1e3).toFixed(2)} µs`
      : `${Math.round(ns)} ns`

const sizeLabel = (size: number) =>
  size >= 1024 ? `${size / 1024} KiB` : `${size} B`

function speedup(
  base: number,
  candidates: readonly (readonly [name: string, ns: number | undefined])[],
) {
  const available = candidates.filter(
    (candidate): candidate is readonly [name: string, ns: number] =>
      candidate[1] !== undefined,
  )
  if (available.length === 0) return 'n/a'
  const [fastest] = available
  if (!fastest) return 'n/a'
  const result = available.reduce((best, candidate) =>
    candidate[1] < best[1] ? candidate : best,
  )
  return `${(base / result[1]).toFixed(2)}× (${result[0]})`
}

/** Right-aligns cells to the widest entry in each column. */
function table(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
) {
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => row[i]!.length)),
  )
  const line = (cells: readonly string[]) =>
    cells.map((cell, i) => cell.padStart(widths[i]! + 2)).join('')
  console.log(line(headers))
  for (const row of rows) console.log(line(row))
}

const bytes = (length: number, modulus = 251) =>
  Uint8Array.from({ length }, (_, index) => index % modulus)

const privateKey = new Uint8Array(32)
privateKey[31] = 1
const privateKeyB = new Uint8Array(32)
privateKeyB[31] = 2
const payload = bytes(32)

CoreEngine.reset()

const blsPublicKey = bls.getPublicKey(privateKey, 'G1')
const blsPublicKeyB = bls.getPublicKey(privateKeyB, 'G1')
const blsSignature = bls.sign(payload, privateKey, { group: 'G2' })

sync('Bls', 'aggregate', '2 G1 points', () =>
  bls.aggregate([blsPublicKey, blsPublicKeyB], 'G1'),
)
sync('Bls', 'getPublicKey', 'G1', () => bls.getPublicKey(privateKey, 'G1'))
sync('Bls', 'randomSecretKey', '32 B key', bls.randomSecretKey)
sync(
  'Bls',
  'sign',
  '32 B message, G2 signature',
  () => bls.sign(payload, privateKey, { group: 'G2' }),
  { batch: 1 },
)
sync(
  'Bls',
  'verify',
  '32 B message, G2 signature',
  () =>
    bls.verify(blsSignature, payload, blsPublicKey, {
      signatureGroup: 'G2',
    }),
  { batch: 1 },
)

const ed25519PrivateKey = bytes(32, 97)
const ed25519PublicKey = ed25519.getPublicKey(ed25519PrivateKey)
const ed25519Signature = ed25519.sign(payload, ed25519PrivateKey)

sync(
  'Ed25519',
  'getPublicKey',
  '32 B key',
  () => ed25519.getPublicKey(ed25519PrivateKey),
  { cKey: 'ed25519.getPublicKey:32' },
)
sync('Ed25519', 'randomSecretKey', '32 B key', ed25519.randomSecretKey)
sync(
  'Ed25519',
  'sign',
  '32 B message',
  () => ed25519.sign(payload, ed25519PrivateKey),
  { cKey: 'ed25519.sign:32' },
)
sync('Ed25519', 'toMontgomery', '32 B public key', () =>
  ed25519.toMontgomery(ed25519PublicKey),
)
sync(
  'Ed25519',
  'toMontgomerySecret',
  '32 B private key',
  () => ed25519.toMontgomerySecret(ed25519PrivateKey),
  { cKey: 'ed25519.toMontgomerySecret:32' },
)
sync(
  'Ed25519',
  'verify',
  '32 B message',
  () => ed25519.verify(ed25519Signature, payload, ed25519PublicKey),
  { cKey: 'ed25519.verify:32' },
)

const hashKey = bytes(32, 97)
const hashSizes = [32, 64, 256, 1024, 4096, 65_536, 1_048_576] as const
const hashStreamInput = bytes(1_048_576)
const hashStreamChunkSize = 65_536

function streamHash(create: () => CoreEngine.HashState, digestSize: number) {
  const output = new Uint8Array(digestSize)
  return () => {
    const state = create()
    for (
      let offset = 0;
      offset < hashStreamInput.length;
      offset += hashStreamChunkSize
    )
      state.update(
        hashStreamInput.subarray(offset, offset + hashStreamChunkSize),
      )
    state.digestInto(output)
    return output
  }
}

for (const size of hashSizes) {
  const input = bytes(size)
  const case_ = `${sizeLabel(size)} input`
  sync('Hash', 'blake3', case_, () => hash.blake3(input), {
    cKey: `hash.blake3:${size}`,
  })
  sync('Hash', 'hmacSha256', case_, () => hash.hmacSha256(hashKey, input), {
    cKey: `hash.hmacSha256:${size}`,
  })
  sync('Hash', 'keccak256', case_, () => hash.keccak256(input), {
    cKey: `hash.keccak256:${size}`,
  })
  sync('Hash', 'ripemd160', case_, () => hash.ripemd160(input), {
    cKey: `hash.ripemd160:${size}`,
  })
  sync('Hash', 'sha256', case_, () => hash.sha256(input), {
    cKey: `hash.sha256:${size}`,
  })
}

const hashStreamCase = '1 MiB input, 64 KiB chunks'
sync(
  'Hash',
  'createBlake3',
  hashStreamCase,
  streamHash(hash.createBlake3, 32),
  {
    batch: 1,
    cKey: 'hash.blake3_stream:1048576',
  },
)
sync(
  'Hash',
  'createHmacSha256',
  hashStreamCase,
  streamHash(() => hash.createHmacSha256(hashKey), 32),
  {
    batch: 1,
    cKey: 'hash.hmac_sha256_stream:1048576',
  },
)
sync(
  'Hash',
  'createKeccak256',
  hashStreamCase,
  streamHash(hash.createKeccak256, 32),
  {
    batch: 1,
    cKey: 'hash.keccak256_stream:1048576',
  },
)
sync(
  'Hash',
  'createRipemd160',
  hashStreamCase,
  streamHash(hash.createRipemd160, 20),
  {
    batch: 1,
    cKey: 'hash.ripemd160_stream:1048576',
  },
)
sync(
  'Hash',
  'createSha256',
  hashStreamCase,
  streamHash(hash.createSha256, 32),
  {
    batch: 1,
    cKey: 'hash.sha256_stream:1048576',
  },
)

const aesKey = bytes(16, 97)
const aesIv = bytes(16, 53)
const aesPlaintext = bytes(4096)
const aesCiphertext = keystore.aesCtrEncrypt(aesKey, aesIv, aesPlaintext)
const password = bytes(16, 97)
const salt = bytes(32, 89)
const pbkdf2Options = { c: 262_144, dkLen: 32 }
const scryptCases = [
  { N: 1_024, dkLen: 32, p: 1, r: 1 },
  { N: 16_384, dkLen: 32, p: 1, r: 8 },
  { N: 262_144, dkLen: 32, p: 8, r: 1 },
] as const

sync('Keystore', 'aesCtrDecrypt', '4 KiB input, AES-128', () =>
  keystore.aesCtrDecrypt(aesKey, aesIv, aesCiphertext),
)
sync('Keystore', 'aesCtrEncrypt', '4 KiB input, AES-128', () =>
  keystore.aesCtrEncrypt(aesKey, aesIv, aesPlaintext),
)
sync(
  'Keystore',
  'pbkdf2Sha256',
  '262,144 iterations, 32 B output',
  () => keystore.pbkdf2Sha256(password, salt, pbkdf2Options),
  { batch: 1, cKey: 'keystore.pbkdf2Sha256:32' },
)
async_('Keystore', 'pbkdf2Sha256Async', '262,144 iterations, 32 B output', () =>
  keystore.pbkdf2Sha256Async(password, salt, pbkdf2Options),
)
for (const options of scryptCases)
  sync(
    'Keystore',
    'scrypt',
    `N=${options.N.toLocaleString('en-US')}, r=${options.r}, p=${options.p}`,
    () => keystore.scrypt(password, salt, options),
    { batch: 1, cKey: `keystore.scrypt:${options.N}` },
  )
const scryptOptions = scryptCases[1]
async_('Keystore', 'scryptAsync', 'N=16,384, r=8, p=1', () =>
  keystore.scryptAsync(password, salt, scryptOptions),
)

const mlDsa44PrivateKey = bytes(32, 97)
const mlDsa44PublicKey = mlDsa44.getPublicKey(mlDsa44PrivateKey)
const mlDsa44SignOptions = { extraEntropy: false } as const
const mlDsa44Signature = mlDsa44.sign(
  payload,
  mlDsa44PrivateKey,
  mlDsa44SignOptions,
)

sync(
  'MlDsa44',
  'getPublicKey',
  '32 B seed',
  () => mlDsa44.getPublicKey(mlDsa44PrivateKey),
  { cKey: 'mldsa44.getPublicKey:32' },
)
sync('MlDsa44', 'randomSecretKey', '32 B seed', mlDsa44.randomSecretKey)
sync(
  'MlDsa44',
  'sign',
  '32 B message',
  () => mlDsa44.sign(payload, mlDsa44PrivateKey, mlDsa44SignOptions),
  { cKey: 'mldsa44.sign:32' },
)
sync(
  'MlDsa44',
  'verify',
  '32 B message',
  () => mlDsa44.verify(mlDsa44Signature, payload, mlDsa44PublicKey, {}),
  { cKey: 'mldsa44.verify:32' },
)

const phrase =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

sync(
  'Mnemonic',
  'toSeed',
  '12 words, empty passphrase',
  () => mnemonic.toSeed(phrase, ''),
  { cKey: 'mnemonic.toSeed:12' },
)

const ecdsaSignOptions = { extraEntropy: false, prehash: false } as const
const ecdsaVerifyOptions = { prehash: false } as const

const p256PublicKey = p256.getPublicKey(privateKey)
const p256PublicKeyB = p256.getPublicKey(privateKeyB)
const p256Signature = p256.sign(payload, privateKey, ecdsaSignOptions)
const p256CompactSignature = p256Signature.slice(1)

sync('P256', 'getPublicKey', '32 B private key', () =>
  p256.getPublicKey(privateKey),
)
sync('P256', 'getSharedSecret', 'uncompressed public key', () =>
  p256.getSharedSecret(privateKey, p256PublicKeyB),
)
sync('P256', 'recoverPublicKey', '32 B message', () =>
  p256.recoverPublicKey(p256Signature, payload),
)
sync('P256', 'randomSecretKey', '32 B key', p256.randomSecretKey)
sync('P256', 'sign', '32 B message', () =>
  p256.sign(payload, privateKey, ecdsaSignOptions),
)
sync('P256', 'verify', '32 B message', () =>
  p256.verify(p256CompactSignature, payload, p256PublicKey, ecdsaVerifyOptions),
)

const secp256k1PublicKey = secp256k1.getPublicKey(privateKey)
const secp256k1PublicKeyB = secp256k1.getPublicKey(privateKeyB)
const secp256k1Signature = secp256k1.sign(payload, privateKey, ecdsaSignOptions)
const secp256k1CompactSignature = secp256k1Signature.slice(1)

sync(
  'Secp256k1',
  'getPublicKey',
  '32 B private key',
  () => secp256k1.getPublicKey(privateKey),
  { cKey: 'secp256k1.getPublicKey:32' },
)
sync(
  'Secp256k1',
  'getSharedSecret',
  'uncompressed public key',
  () => secp256k1.getSharedSecret(privateKey, secp256k1PublicKeyB),
  { cKey: 'secp256k1.getSharedSecret:65' },
)
sync(
  'Secp256k1',
  'recoverPublicKey',
  '32 B message',
  () => secp256k1.recoverPublicKey(secp256k1Signature, payload),
  { cKey: 'secp256k1.recoverPublicKey:32' },
)
sync('Secp256k1', 'randomSecretKey', '32 B key', secp256k1.randomSecretKey)
sync(
  'Secp256k1',
  'sign',
  '32 B message',
  () => secp256k1.sign(payload, privateKey, ecdsaSignOptions),
  { cKey: 'secp256k1.sign:32' },
)
sync(
  'Secp256k1',
  'verify',
  '32 B message',
  () =>
    secp256k1.verify(
      secp256k1CompactSignature,
      payload,
      secp256k1PublicKey,
      ecdsaVerifyOptions,
    ),
  { cKey: 'secp256k1.verify:32' },
)

const x25519PrivateKey = bytes(32, 97)
const x25519PrivateKeyB = bytes(32, 89)
const x25519PublicKeyB = x25519.getPublicKey(x25519PrivateKeyB)

sync(
  'X25519',
  'getPublicKey',
  '32 B private key',
  () => x25519.getPublicKey(x25519PrivateKey),
  { cKey: 'x25519.getPublicKey:32' },
)
sync(
  'X25519',
  'getSharedSecret',
  '32 B public key',
  () => x25519.getSharedSecret(x25519PrivateKey, x25519PublicKeyB),
  { cKey: 'x25519.getSharedSecret:32' },
)
sync('X25519', 'randomSecretKey', '32 B key', x25519.randomSecretKey)

for (const [slot, primitives] of Object.entries(engineContract.primitives))
  for (const primitive of primitives)
    if (
      !benchmarks.some(
        (benchmark) =>
          benchmark.slot === slot && benchmark.primitive === primitive,
      )
    )
      throw new Error(`Missing benchmark for ${slot}.${primitive}`)

const node = await nodeEngine()
const [wasmAggregate, wasmKeystore, wasmMlDsa44, wasmSecp256k1] =
  await Promise.all([
    wasmEngine(),
    wasmKeystoreEngine(),
    wasmMlDsa44Engine(),
    wasmSecp256k1Engine(),
  ])
const wasm = {
  ...wasmAggregate,
  Keystore: wasmKeystore,
  MlDsa44: wasmMlDsa44,
  Secp256k1: wasmSecp256k1,
}
const cRows = c()
for (const benchmark of benchmarks) {
  if (supports(wasm, benchmark) !== Boolean(benchmark.cKey))
    throw new Error(
      `Native C coverage does not match WASM for ${benchmark.slot}.${benchmark.primitive}`,
    )
  if (cRows && benchmark.cKey && !cRows.has(benchmark.cKey))
    throw new Error(`Missing native C result for ${benchmark.cKey}`)
}

const headers = [
  'primitive',
  'case',
  'ox',
  'ox/node',
  'ox/wasm',
  'C',
  'fastest Ox engine vs ox',
]

console.log(
  'Best-observed time per call. Lower is better; C is reference only.',
)

for (const slot of engineContract.slots) {
  const rows: string[][] = []
  for (const benchmark of benchmarks.filter(
    (benchmark) => benchmark.slot === slot,
  )) {
    const base = await measure(benchmark)
    const nodeNs = supports(node, benchmark)
      ? await measure(benchmark, node)
      : undefined
    const wasmNs = supports(wasm, benchmark)
      ? await measure(benchmark, wasm)
      : undefined
    const cNs = benchmark.cKey ? cRows?.get(benchmark.cKey) : undefined
    rows.push([
      benchmark.primitive,
      benchmark.case,
      format(base),
      nodeNs === undefined ? 'n/a' : format(nodeNs),
      wasmNs === undefined ? 'n/a' : format(wasmNs),
      benchmark.cKey
        ? cNs === undefined
          ? 'unavailable'
          : format(cNs)
        : 'n/a',
      speedup(base, [
        ['node', nodeNs],
        ['wasm', wasmNs],
      ]),
    ])
  }
  console.log(`\n${slot}`)
  table(headers, rows)
}

void sink
