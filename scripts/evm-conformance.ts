// Runs the `ethereum/execution-spec-tests` state fixtures through the public
// TypeScript EVM stack.
//
//   node --import tsx scripts/evm-conformance.ts <fixtures/state_tests>
//     [--fork Prague] [--limit N] [--filter substring] [--show N]
//
// Fixtures are pinned to release v5.4.0 (`fixtures_develop.tar.gz`). Download:
//
//   mkdir -p test/evm/fixtures && curl -sL \
//     https://github.com/ethereum/execution-spec-tests/releases/download/v5.4.0/fixtures_develop.tar.gz \
//     | tar -xz -C test/evm/fixtures --strip-components=1 fixtures/state_tests
//
// State tests carry an explicit expected post-state, so conformance is an
// account-by-account comparison and needs no Merkle-Patricia trie.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import * as eest from '../test/evm/eest.js'

function* walk(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (entry.endsWith('.json')) yield path
  }
}

const args = process.argv.slice(2)
const root = args[0]
if (!root) {
  console.error('usage: evm-conformance.ts <fixtures/state_tests> [options]')
  process.exit(2)
}
const option = (name: string) => {
  const index = args.indexOf(name)
  return index < 0 ? undefined : args[index + 1]
}
const onlyFork = option('--fork')
const limit = Number(option('--limit') ?? Number.POSITIVE_INFINITY)
const filter = option('--filter')
const show = Number(option('--show') ?? 8)
const supportedForks = new Set(['Cancun', 'Prague', 'Osaka'])

let pass = 0
let fail = 0
let skip = 0
const gasDeltas = new Map<string, number>()
const reasons = new Map<string, number>()
const samples = new Map<string, string>()
const skippedForks = new Map<string, number>()
const byFork = new Map<string, { fail: number; pass: number }>()

function record(outcome: eest.Outcome, name: string, fork: string) {
  const tally = byFork.get(fork) ?? { fail: 0, pass: 0 }
  if (outcome.ok) tally.pass++
  else tally.fail++
  byFork.set(fork, tally)
  if (outcome.ok) {
    pass++
    return
  }
  fail++
  reasons.set(outcome.reason, (reasons.get(outcome.reason) ?? 0) + 1)
  if (outcome.reason === 'balance' && outcome.detail) {
    const gas = /gas-delta (-?\d+)/.exec(outcome.detail)
    const wei = /wei-delta (-?\d+)/.exec(outcome.detail)
    const key =
      gas && gas[1] !== '0' ? `gas ${gas[1]}` : `wei ${wei?.[1] ?? '?'}`
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
  const document = (() => {
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    } catch {
      return undefined
    }
  })()
  if (!document) continue
  for (const [name, value] of Object.entries(document)) {
    const fixture = value as eest.FixtureCase
    for (const [fork, posts] of Object.entries(fixture.post ?? {})) {
      if (onlyFork && fork !== onlyFork) continue
      if (!supportedForks.has(fork)) {
        skip += posts.length
        skippedForks.set(fork, (skippedForks.get(fork) ?? 0) + posts.length)
        continue
      }
      for (const post of posts) {
        const outcome = (() => {
          try {
            return eest.runCase(fixture, fork, post).outcome
          } catch (error) {
            if (process.env.DEBUG) console.log((error as Error).stack)
            return {
              ok: false as const,
              reason: `threw:${(error as Error).message.slice(0, 40)}`,
            }
          }
        })()
        if (process.env.CASES)
          console.log(`CASE ${outcome.ok ? 'PASS' : 'FAIL'} ${name}`)
        record(outcome, name, fork)
        if (pass + fail >= limit) break outer
      }
    }
  }
}

const total = pass + fail
console.log(
  `\n${pass}/${total} passed (${total ? ((pass / total) * 100).toFixed(2) : '0.00'}%)  ${onlyFork ?? 'all forks'}${
    skip ? `  - ${skip} skipped (unsupported forks)` : ''
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
