/**
 * Rebuilds every WASM target and fails if the result differs from what is
 * committed.
 *
 * This is what makes the committed base64 trustworthy: without it, an artifact
 * and the C it claims to come from can drift apart indefinitely -- which is
 * exactly what happened to the salt miner, whose build script was deleted while
 * the generated module kept pointing at it.
 *
 * Usage:
 *   pnpm wasm:check
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { buildAll } from './build.js'
import { resolve, root } from './toolchain.js'

const toolchain = await resolve()

if (toolchain.overridden) {
  console.error(
    'error: `OX_WASM_CLANG` is set. Artifacts can only be verified against the pinned toolchain.',
  )
  process.exit(1)
}

let failed = false

for (const { source, target } of await buildAll()) {
  const file = path.join(root, target.out)
  const committed = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

  if (committed === source) {
    console.log(`✔ ${target.name}`)
    continue
  }

  failed = true
  console.error(`✘ ${target.name} — ${target.out} is out of date.`)

  const expected = /'([A-Za-z0-9+/=]*)'/.exec(committed)?.[1] ?? ''
  const actual = /'([A-Za-z0-9+/=]*)'/.exec(source)?.[1] ?? ''

  if (expected === actual) {
    console.error('  The binary matches; only the surrounding module differs.')
  } else {
    console.error(
      `  committed: ${expected.length} base64 chars\n  rebuilt:   ${actual.length} base64 chars`,
    )
    let at = -1
    for (let index = 0; index < actual.length; index++)
      if (actual[index] !== expected[index]) {
        at = index
        break
      }
    if (at >= 0)
      console.error(
        `  first difference at base64 offset ${at}:\n    committed …${expected.slice(at, at + 32)}…\n    rebuilt   …${actual.slice(at, at + 32)}…`,
      )
  }
}

if (failed) {
  console.error('\nRun `pnpm wasm:build` and commit the result.')
  process.exit(1)
}
