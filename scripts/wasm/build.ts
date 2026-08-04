/**
 * Builds the WASM artifacts and writes the generated files.
 *
 * Two builders sit behind this, and they stay separate: the C targets go through
 * `clang` from a pinned wasi-sdk, and the evm2 adapter goes through `cargo` from
 * a pinned Rust toolchain. Their inputs, flags, and size rules have nothing in
 * common, so this selects between them rather than pretending they are one
 * flag-driven build.
 *
 * Usage:
 *   pnpm wasm:build                  # everything
 *   pnpm wasm:build --target=hashes  # one C target
 *   pnpm wasm:build --target=evm2    # the Rust adapter only
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as evm2 from './build-evm2.js'
import { buildC, names as cNames } from './build-c.js'
import { root } from './toolchain.js'

/** Reads `--target=` selections. Empty means everything. */
export function selection(argv: readonly string[]) {
  const selected = argv
    .filter((arg) => arg.startsWith('--target='))
    .map((arg) => arg.slice('--target='.length))

  const known = [...cNames, evm2.name]
  const unknown = selected.filter((name) => !known.includes(name))
  if (unknown.length)
    throw new Error(
      `Unknown target(s): ${unknown.join(', ')}. Known: ${known.join(', ')}`,
    )

  return {
    c: selected.length
      ? selected.filter((name) => cNames.includes(name))
      : cNames,
    // Selecting nothing means everything; selecting C targets only means the
    // Rust toolchain is not needed at all.
    evm2: selected.length === 0 || selected.includes(evm2.name),
  }
}

/**
 * Builds the selected artifacts and returns every generated file, keyed by
 * repository-relative path.
 */
export async function buildAll(argv: readonly string[] = []) {
  const selected = selection(argv)
  return {
    ...(await buildC(selected.c)),
    ...(selected.evm2 ? await evm2.buildEvm2() : {}),
  }
}

if (import.meta.filename === process.argv[1]) {
  const files = await buildAll(process.argv.slice(2))
  for (const [file, contents] of Object.entries(files))
    fs.writeFileSync(path.join(root, file), contents)
}
