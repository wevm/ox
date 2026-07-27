/**
 * Three-way hash benchmark: ox's default, `ox/wasm`, and native Rust.
 *
 * `pnpm bench` covers the first two through Vitest, which cannot run native
 * code. This script exists for the third: it times the JavaScript sides itself,
 * shells out to `bench/native` for the Rust one, and prints them in one table
 * so the columns are actually comparable -- same sizes, same warmup, same
 * budget, same `min` over repeats on both sides.
 *
 * The native column needs `cargo`. Without it the script still runs and simply
 * omits that column, so this is not a hard dependency of the repository.
 */

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 as noble_ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { load } from '../src/wasm/Hash.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const sizes = [32, 64, 256, 1024, 4096, 65_536, 1_048_576]
const warmupMs = 200
const budgetMs = 900
const repeats = 3

/**
 * Nanoseconds per call, best of `repeats`.
 *
 * Interference only ever makes a sample slower, so the minimum is the robust
 * estimator -- a mean would fold in whatever else the machine was doing.
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

/** Native rows, or `undefined` where `cargo` is unavailable. */
function native() {
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
    const crates = new Map<string, string>()
    for (const line of stdout.trim().split('\n').slice(1)) {
      const [primitive, krate, size, ns] = line.split(',') as [
        string,
        string,
        string,
        string,
      ]
      rows.set(`${primitive}:${size}`, Number(ns))
      crates.set(primitive, krate)
    }
    return { crates, rows }
  } catch (error) {
    // Cargo missing, or the crate failed to build. Either way the JavaScript
    // columns are still worth printing, so report why and carry on.
    const reason = (error as { stderr?: string }).stderr
      ?.trim()
      .split('\n')
      .pop()
    console.log(`native column omitted: ${reason ?? 'cargo not available'}\n`)
    return undefined
  }
}

const engine = await load()
const wasm = engine.Hash!
const key = new Uint8Array(32).map((_, i) => i % 97)

const primitives = [
  {
    name: 'keccak256',
    default: (input: Uint8Array) => noble_keccak256(input),
    wasm: (input: Uint8Array) => wasm.keccak256!(input),
  },
  {
    name: 'sha256',
    default: (input: Uint8Array) => noble_sha256(input),
    wasm: (input: Uint8Array) => wasm.sha256!(input),
  },
  {
    name: 'ripemd160',
    default: (input: Uint8Array) => noble_ripemd160(input),
    wasm: (input: Uint8Array) => wasm.ripemd160!(input),
  },
  {
    name: 'hmacSha256',
    default: (input: Uint8Array) => hmac(noble_sha256, key, input),
    wasm: (input: Uint8Array) => wasm.hmacSha256!(key, input),
  },
]

const rust = native()

const format = (ns: number) =>
  ns >= 1e6 ? `${(ns / 1e6).toFixed(2)}ms` : `${Math.round(ns)}`
const label = (size: number) =>
  size >= 1024 ? `${size / 1024} KiB` : `${size} B`

/** Right-aligns cells to the widest entry in each column. */
function table(headers: string[], rows: string[][]) {
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => row[i]!.length)),
  )
  const line = (cells: string[]) =>
    cells.map((cell, i) => cell.padStart(widths[i]! + 2)).join('')
  console.log(line(headers))
  for (const row of rows) console.log(line(row))
}

for (const primitive of primitives) {
  // Column headers name the implementation rather than a category: the Rust
  // crate differs per primitive, since `alloy-primitives` only offers keccak256.
  const crate = rust?.crates.get(primitive.name)
  const headers = ['size', '@noble/hashes', 'ox/wasm']
  if (crate) headers.push(crate, `wasm / ${crate}`)

  const rows = sizes.map((size) => {
    const input = new Uint8Array(size).map((_, i) => i % 251)
    const base = measure(() => primitive.default(input))
    const wasmNs = measure(() => primitive.wasm(input))
    const row = [label(size), format(base), format(wasmNs)]
    const nativeNs = rust?.rows.get(`${primitive.name}:${size}`)
    if (nativeNs !== undefined)
      row.push(format(nativeNs), `${(wasmNs / nativeNs).toFixed(2)}x`)
    return row
  })

  console.log(`\n${primitive.name}`)
  table(headers, rows)
}
