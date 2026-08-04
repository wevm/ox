/**
 * Rebuilds the WASM artifacts and fails if anything differs from what is
 * committed.
 *
 * This is what makes the committed base64 trustworthy: without it, an artifact
 * and the source it claims to come from can drift apart indefinitely -- which is
 * exactly what happened to the salt miner, whose build script was deleted while
 * the generated module kept pointing at it.
 *
 * Usage:
 *   pnpm wasm:check
 *   pnpm wasm:check --target=evm2
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { buildAll, selection } from './build.js'
import { resolve, root } from './toolchain.js'

const selected = selection(process.argv.slice(2))

// Neither builder can be verified against an overridden toolchain: the bytes
// would be whatever the local environment produced, not what the pins define.
if (selected.evm2 && process.env.OX_EVM2_NATIVE) {
  console.error(
    'error: `OX_EVM2_NATIVE` is set. The evm2 artifact can only be verified against the pinned image, since rustc output differs by host platform.',
  )
  process.exit(1)
}

if (selected.c.length) {
  const toolchain = await resolve()
  if (toolchain.overridden) {
    console.error(
      'error: `OX_WASM_CLANG` is set. Artifacts can only be verified against the pinned toolchain.',
    )
    process.exit(1)
  }
}

let failed = false

for (const [file, rebuilt] of Object.entries(
  await buildAll(process.argv.slice(2)),
)) {
  const absolute = path.join(root, file)
  const committed = fs.existsSync(absolute)
    ? fs.readFileSync(absolute, 'utf8')
    : ''

  if (committed === rebuilt) {
    console.log(`✔ ${file}`)
    continue
  }

  failed = true
  console.error(`✘ ${file} is out of date.`)

  const expected = /'([A-Za-z0-9+/=]*)'/.exec(committed)?.[1] ?? ''
  const actual = /'([A-Za-z0-9+/=]*)'/.exec(rebuilt)?.[1] ?? ''

  // Files with no base64 payload, such as the notices, only get a size report.
  if (!expected && !actual) {
    console.error(
      `  committed: ${committed.length} chars\n  rebuilt:   ${rebuilt.length} chars`,
    )
    continue
  }

  if (expected === actual) {
    console.error('  The binary matches; only the surrounding module differs.')
    continue
  }

  console.error(
    `  committed: ${expected.length} base64 chars\n  rebuilt:   ${actual.length} base64 chars`,
  )
  for (let index = 0; index < actual.length; index++)
    if (actual[index] !== expected[index]) {
      console.error(
        `  first difference at base64 offset ${index}:\n    committed …${expected.slice(index, index + 32)}…\n    rebuilt   …${actual.slice(index, index + 32)}…`,
      )
      break
    }
}

if (failed) {
  console.error('\nRun `pnpm wasm:build` and commit the result.')
  process.exit(1)
}
