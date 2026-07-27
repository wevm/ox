/**
 * Hash benchmark across Ox's default, Node, WASM, and Rust implementations.
 *
 * `pnpm bench` covers the Ox engines through Vitest, which cannot run Rust.
 * This script times the JavaScript sides itself, shells out to `bench/native`,
 * and prints comparable columns using the same sizes, warmup, budget, and
 * best-observed repeat on both sides.
 *
 * The native column needs `cargo`. Without it the script still runs and marks
 * Rust cells unavailable, so this is not a hard dependency of the repository.
 */

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 as noble_ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { create as createNode } from '../src/node/Hash.js'
import { create as createWasm } from '../src/wasm/Hash.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const sizes = [32, 64, 256, 1024, 4096, 65_536, 1_048_576]
const warmupMs = 200
const budgetMs = 900
const repeats = 3

/**
 * Nanoseconds per call, using the best-observed repeat.
 *
 * This favors peak throughput and avoids presenting the result as a latency
 * distribution.
 */
function measure(run: () => void) {
  let best = Number.POSITIVE_INFINITY
  for (let repeat = 0; repeat < repeats; repeat++) {
    const warmup = performance.now()
    while (performance.now() - warmup < warmupMs) run()
    let iters = 0
    const start = performance.now()
    while (performance.now() - start < budgetMs) {
      for (let i = 0; i < 32; i++) run()
      iters += 32
    }
    best = Math.min(best, ((performance.now() - start) * 1e6) / iters)
  }
  return best
}

/** Alloy rows, or `undefined` where `cargo` is unavailable. */
function rust() {
  try {
    // Run from the crate directory, not via `--manifest-path`: rustup resolves
    // `rust-toolchain.toml` by walking up from the working directory, and
    // without it the default toolchain is usually too old to build `alloy`.
    const stdout = execFileSync('cargo', ['run', '--release', '--quiet'], {
      cwd: join(root, 'bench/native'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const rows = new Map<string, number>()
    for (const line of stdout.trim().split('\n').slice(1)) {
      const [primitive, size, ns] = line.split(',') as [string, string, string]
      rows.set(`${primitive}:${size}`, Number(ns))
    }
    return rows
  } catch (error) {
    // Cargo missing, or the crate failed to build. The Ox columns are still
    // worth printing, so report why and mark Rust cells unavailable.
    const reason = (error as { stderr?: string }).stderr
      ?.trim()
      .split('\n')
      .pop()
    console.log(`Rust unavailable: ${reason ?? 'cargo not available'}\n`)
    return undefined
  }
}

const node = (await createNode()).Hash
const wasm = (await createWasm()).Hash
const key = new Uint8Array(32).map((_, i) => i % 97)

const primitives = [
  {
    name: 'keccak256',
    default: (input: Uint8Array) => noble_keccak256(input),
    node: undefined,
    wasm: (input: Uint8Array) => wasm.keccak256(input),
  },
  {
    name: 'sha256',
    default: (input: Uint8Array) => noble_sha256(input),
    node: (input: Uint8Array) => node.sha256(input),
    wasm: (input: Uint8Array) => wasm.sha256(input),
  },
  {
    name: 'ripemd160',
    default: (input: Uint8Array) => noble_ripemd160(input),
    node: (input: Uint8Array) => node.ripemd160(input),
    wasm: (input: Uint8Array) => wasm.ripemd160(input),
  },
  {
    name: 'hmacSha256',
    default: (input: Uint8Array) => hmac(noble_sha256, key, input),
    node: (input: Uint8Array) => node.hmacSha256(key, input),
    wasm: (input: Uint8Array) => wasm.hmacSha256(key, input),
  },
]

const rustRows = rust()

const format = (ns: number) =>
  ns >= 1e6
    ? `${(ns / 1e6).toFixed(2)} ms`
    : ns >= 1e3
      ? `${(ns / 1e3).toFixed(2)} µs`
      : `${Math.round(ns)} ns`
const label = (size: number) =>
  size >= 1024 ? `${size / 1024} KiB` : `${size} B`
const speedup = (
  base: number,
  candidates: readonly (readonly [name: string, ns: number | undefined])[],
) => {
  const available = candidates.filter(
    (candidate): candidate is readonly [name: string, ns: number] =>
      candidate[1] !== undefined,
  )
  const fastest = available.reduce((best, candidate) =>
    candidate[1] < best[1] ? candidate : best,
  )
  return `${(base / fastest[1]).toFixed(2)}× (${fastest[0]})`
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

for (const primitive of primitives) {
  const headers = [
    'size',
    'ox',
    'ox/node',
    'ox/wasm',
    'alloy (Rust)',
    'fastest Ox engine vs ox',
  ]

  const rows = sizes.map((size) => {
    const input = new Uint8Array(size).map((_, i) => i % 251)
    const base = measure(() => primitive.default(input))
    const nodeFn = primitive.node
    const nodeNs = nodeFn ? measure(() => nodeFn(input)) : undefined
    const wasmNs = measure(() => primitive.wasm(input))
    const rustNs = rustRows?.get(`${primitive.name}:${size}`)
    return [
      label(size),
      format(base),
      nodeNs === undefined ? 'n/a' : format(nodeNs),
      format(wasmNs),
      primitive.name !== 'keccak256'
        ? 'n/a'
        : rustNs === undefined
          ? 'unavailable'
          : format(rustNs),
      speedup(base, [
        ['node', nodeNs],
        ['wasm', wasmNs],
      ]),
    ]
  })

  console.log(`\n${primitive.name}`)
  table(headers, rows)
}
