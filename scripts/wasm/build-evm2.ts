/**
 * Compiles the `wasm/evm2` Rust adapter and writes it as base64 inside a
 * TypeScript module, alongside the attribution notice for everything it links.
 *
 * The adapter binds a pinned `alloy-rs/evm2` revision, which Cargo resolves from
 * its own external cache -- evm2's source never enters this repository. Because
 * the committed base64 *is* the shipped artifact, the build pins the toolchain,
 * builds `--locked`, remaps dependency paths out of the binary, and refuses an
 * artifact that reaches for anything beyond the four host database imports.
 *
 * `scripts/wasm/build.ts` and `check.ts` are the entrypoints. This module only
 * builds; it does not write.
 */

import * as child_process from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as zlib from 'node:zlib'
import { resolveWasmOpt, root, toolchain as pinned } from './toolchain.js'

const crate = path.join(root, 'wasm/evm2')
const out = 'src/wasm/internal/evm2.wasm.ts'
const notice = 'wasm/evm2/NOTICE.md'
const target = 'wasm32-unknown-unknown'

/** Where the container drops the artifact, kept out of cargo's own target dir. */
const buildDir = path.join(root, 'wasm/.build/evm2')

/**
 * Hard ceiling on the artifact, in bytes.
 *
 * A size regression is a decision, not a surprise: raise this deliberately with
 * the measurements that justify it.
 */
const maxBytes = 1_048_576

/**
 * Imports the artifact is allowed to declare.
 *
 * The list is exact. A new import means the adapter grew a dependency on its
 * environment -- WASI, threads, randomness -- which would break the runtimes Ox
 * ships to.
 */
const allowedImports = [
  'ox_evm2.get_account',
  'ox_evm2.get_block_hash',
  'ox_evm2.get_code_by_hash',
  'ox_evm2.get_storage',
]

/** The pinned evm2 revision and the Cargo features selected for it. */
function dependency() {
  const source = fs.readFileSync(path.join(crate, 'Cargo.toml'), 'utf8')
  const block = /evm2 = \{([^}]*)\}/s.exec(source)?.[1]
  if (!block) throw new Error('Could not find the `evm2` dependency.')
  const revision = /rev = "([0-9a-f]{40})"/.exec(block)?.[1]
  if (!revision)
    throw new Error(
      '`evm2` must be pinned by full commit SHA, never by branch or tag.',
    )
  const list = /features = \[([^\]]*)\]/s.exec(block)?.[1] ?? ''
  const features = [...list.matchAll(/"([^"]+)"/g)].map(
    ([, feature]) => feature!,
  )
  return { features, revision }
}

/** Runs `cargo` on the host. Used for metadata, never for the shipped bytes. */
function cargo(args: readonly string[], env: Record<string, string> = {}) {
  return child_process.execFileSync('cargo', args, {
    cwd: crate,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'inherit'],
  })
}

function remap(from: string, to: string) {
  return `--remap-path-prefix=${from}=${to}`
}

/** What the pinned image reports back, so the host never needs cargo. */
type Compiled = {
  /** Path to the unoptimized artifact. */
  artifact: string
  /** evm2's own license texts, keyed by filename. */
  licenses: Record<string, string>
  /** `cargo metadata` for the wasm target. */
  metadata: string
  /** The `rustc` that produced the artifact. */
  rustc: string
}

/**
 * Compiles the adapter inside the pinned Rust image.
 *
 * `rustc` output is not byte-identical across host platforms, unlike the
 * wasi-sdk `clang` the C targets use: the same source, lockfile, and target
 * differ by a few hundred bytes between macOS and Linux, so a host build can
 * never satisfy `wasm:check`. Compiling in one pinned image makes the artifact a
 * function of the image, the lockfile, and the source. `wasm-opt` is host-stable
 * and still runs natively.
 *
 * Everything cargo knows comes back with the artifact: the dependency graph and
 * evm2's license texts both live in the image's Cargo cache, which the host has
 * no reason to populate.
 *
 * `OX_EVM2_NATIVE` builds on the host instead, for local iteration only.
 * `wasm:check` refuses to verify against it.
 */
function compile(revision: string): Compiled {
  // Both paths write the optimized artifact here, so it must exist either way.
  fs.mkdirSync(buildDir, { recursive: true })

  const metadata = [
    'metadata',
    '--format-version=1',
    '--locked',
    '--filter-platform',
    target,
  ]
  // Cargo names its checkout directory after the URL hash and the short
  // revision, so the license texts sit at a predictable path.
  const licenseDir = `"$(dirname "$(find "$CARGO_HOME/git/checkouts" -maxdepth 2 -type d -name '${revision.slice(0, 7)}*' -path '*evm2-*' | head -1)"/${revision.slice(0, 7)}*)"`

  if (process.env.OX_EVM2_NATIVE) {
    console.warn(
      'warning: `OX_EVM2_NATIVE` is set. Building on the host instead of the pinned image, so the bytes will not match what is committed.',
    )
    const home = process.env.CARGO_HOME ?? path.join(os.homedir(), '.cargo')
    cargo(['build', '--release', '--locked', `--target=${target}`], {
      RUSTFLAGS: [remap(home, '/cargo'), remap(crate, '/ox-evm2')].join(' '),
    })
    return {
      artifact: path.join(crate, `target/${target}/release/ox_evm2.wasm`),
      licenses: hostLicenses(revision),
      metadata: cargo(metadata),
      rustc: child_process
        .execFileSync('rustc', ['--version'], { cwd: crate, encoding: 'utf8' })
        .trim(),
    }
  }

  const { digest, image, platform } = pinned.rust
  child_process.execFileSync(
    'docker',
    [
      'run',
      '--rm',
      `--platform=${platform}`,
      // Source goes in read-only and only the output directory is writable, so
      // the container cannot touch anything it does not own.
      '--volume',
      `${crate}:/crate:ro`,
      '--volume',
      `${buildDir}:/out`,
      '--workdir',
      '/build',
      '--env',
      `RUSTFLAGS=${[remap('/usr/local/cargo', '/cargo'), remap('/build', '/ox-evm2')].join(' ')}`,
      `${image.split(':')[0]}@${digest}`,
      'bash',
      '-c',
      [
        'set -e',
        'cp -r /crate/. /build/',
        'rm -rf /build/target',
        'rustup target add wasm32-unknown-unknown >/dev/null',
        `cargo build --release --locked --target=${target}`,
        `cp /build/target/${target}/release/ox_evm2.wasm /out/ox_evm2.wasm`,
        `cargo ${metadata.join(' ')} > /out/metadata.json`,
        'rustc --version > /out/rustc.txt',
        `cp ${licenseDir}/LICENSE-MIT ${licenseDir}/LICENSE-APACHE /out/`,
        // The mounted directory is root-owned inside the container; hand it back
        // so the host can read and replace it.
        'chmod -R a+rwX /out',
      ].join(' && '),
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  )

  const read = (file: string) =>
    fs.readFileSync(path.join(buildDir, file), 'utf8')
  return {
    artifact: path.join(buildDir, 'ox_evm2.wasm'),
    licenses: {
      'LICENSE-APACHE': read('LICENSE-APACHE'),
      'LICENSE-MIT': read('LICENSE-MIT'),
    },
    metadata: read('metadata.json'),
    rustc: read('rustc.txt').trim(),
  }
}

/**
 * Asserts the lockfile pins the same revision `Cargo.toml` declares.
 *
 * `--locked` below catches a lockfile that needs updating; this catches one that
 * resolves cleanly but to a different evm2.
 */
function assertLockfile(revision: string) {
  const lockfile = fs.readFileSync(path.join(crate, 'Cargo.lock'), 'utf8')
  if (!lockfile.includes(revision))
    throw new Error(
      `\`wasm/evm2/Cargo.lock\` does not pin evm2 \`${revision}\`. Run \`cargo update -p evm2\` in \`wasm/evm2\` and review the result.`,
    )
}

/**
 * Builds the attribution notice from the resolved dependency graph.
 *
 * Generating it is what keeps it honest: a dependency added, removed, or
 * relicensed shows up as a diff instead of going unrecorded.
 */
function attribution(revision: string, raw: string) {
  type Package = {
    id: string
    license?: string | null
    name: string
    source?: string | null
    targets: readonly { kind: readonly string[] }[]
    version: string
  }
  type Node = {
    deps: readonly {
      dep_kinds: readonly { kind: string | null }[]
      pkg: string
    }[]
    id: string
  }
  const metadata = JSON.parse(raw) as {
    packages: readonly Package[]
    resolve: { nodes: readonly Node[]; root: string }
  }

  const byId = new Map(metadata.packages.map((entry) => [entry.id, entry]))
  const nodes = new Map(metadata.resolve.nodes.map((node) => [node.id, node]))

  // Only normal edges, and no proc macros: build scripts and derive crates run
  // on the host and never reach the artifact.
  const linked = new Set<string>()
  const visit = (id: string) => {
    if (linked.has(id)) return
    linked.add(id)
    for (const dep of nodes.get(id)?.deps ?? []) {
      if (!dep.dep_kinds.some(({ kind }) => kind === null)) continue
      if (
        byId
          .get(dep.pkg)
          ?.targets.some(({ kind }) => kind.includes('proc-macro'))
      )
        continue
      visit(dep.pkg)
    }
  }
  visit(metadata.resolve.root)

  const packages = [...linked]
    .filter((id) => id !== metadata.resolve.root)
    .map((id) => byId.get(id)!)
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
    )

  // A crate resolved from git rather than crates.io is a fork, which is an
  // attribution fact and not only a build detail.
  const rows = packages.map((entry) => {
    const source = entry.source?.startsWith('git+')
      ? entry.source.replace(/^git\+/, '').replace(/\?rev=[0-9a-f]+#/, ' @ ')
      : 'crates.io'
    return `| \`${entry.name}\` | ${entry.version} | ${entry.license ?? 'see upstream'} | ${source} |`
  })

  return `<!-- Generated by \`pnpm wasm:build --target=evm2\`. Do not edit. -->

# Notices for \`src/wasm/internal/evm2.wasm.ts\`

The artifact is compiled from \`wasm/evm2\` against
[\`alloy-rs/evm2\`](https://github.com/alloy-rs/evm2) at commit
\`${revision}\`, which is licensed under MIT OR Apache-2.0. Its license texts are
committed beside this file as \`LICENSE-MIT\` and \`LICENSE-APACHE\`.

Everything compiled into the artifact is listed below, with the license each
crate declares.

| Crate | Version | License | Source |
| --- | --- | --- | --- |
${rows.join('\n')}
`
}

/**
 * Copies evm2's own license texts out of Cargo's checkout.
 *
 * Taking them from the pinned revision rather than transcribing them keeps the
 * committed texts matching the code they cover.
 */
function hostLicenses(revision: string) {
  const home = process.env.CARGO_HOME ?? path.join(os.homedir(), '.cargo')
  const checkouts = path.join(home, 'git/checkouts')
  const short = revision.slice(0, 7)
  for (const directory of fs.readdirSync(checkouts)) {
    if (!directory.startsWith('evm2-')) continue
    const source = path.join(checkouts, directory, short)
    if (!fs.existsSync(source)) continue
    return {
      'LICENSE-APACHE': fs.readFileSync(
        path.join(source, 'LICENSE-APACHE'),
        'utf8',
      ),
      'LICENSE-MIT': fs.readFileSync(path.join(source, 'LICENSE-MIT'), 'utf8'),
    }
  }
  throw new Error(
    `Could not find evm2 \`${short}\` under ${checkouts}. Run \`cargo fetch\` in \`wasm/evm2\`.`,
  )
}

/** Asserts the artifact carries no toolchain fingerprint and no stray imports. */
function assertPortable(bytes: Uint8Array) {
  const text = Buffer.from(bytes).toString('latin1')
  for (const section of ['producers', 'target_features'])
    if (text.includes(section))
      throw new Error(
        `The artifact still contains a \`${section}\` custom section. Artifacts must not embed toolchain metadata.`,
      )

  const home = os.homedir()
  if (text.includes(home))
    throw new Error(
      `The artifact embeds the build machine's home directory (${home}), so it cannot rebuild byte-for-byte elsewhere. Check the \`--remap-path-prefix\` flags.`,
    )

  const imports = WebAssembly.Module.imports(new WebAssembly.Module(bytes))
    .map((entry) => `${entry.module}.${entry.name}`)
    .sort()
  const unexpected = imports.filter((name) => !allowedImports.includes(name))
  if (unexpected.length)
    throw new Error(
      `The artifact imports ${unexpected.join(', ')}. Only the host database reads (${allowedImports.join(', ')}) are allowed, so nothing pulls in WASI, threads, or randomness.`,
    )
}

function template(
  bytes: Uint8Array,
  meta: {
    features: readonly string[]
    gzip: number
    revision: string
    toolchain: string
    wasmOpt: string
  },
) {
  return `// Generated by \`pnpm wasm:build --target=evm2\`. Do not edit.
//
// Compiled from wasm/evm2 against alloy-rs/evm2 ${meta.revision}
// with ${meta.toolchain} + ${meta.wasmOpt}.
//
// Cargo features: ${meta.features.join(', ')}
//
// \`pnpm wasm:check --target=evm2\` rebuilds this file and fails if the bytes differ, so any
// change to the adapter, its lockfile, or the pinned evm2 revision must be
// followed by \`pnpm wasm:build --target=evm2\`.

/** Base64-encoded WASM binary. */
export const wasmBase64 =
  '${Buffer.from(bytes).toString('base64')}'

/** Decoded size of {@link wasmBase64}, in bytes. */
export const wasmBytes = ${bytes.length}

/** Gzipped size of the decoded binary, in bytes. */
export const wasmGzipBytes = ${meta.gzip}

/** The evm2 commit this artifact was compiled against. */
export const evm2Revision = '${meta.revision}'
`
}

/** The selectable name for this builder, alongside the C target names. */
export const name = 'evm2'

/**
 * Compiles the adapter and returns its generated files, keyed by
 * repository-relative path.
 */
export async function buildEvm2(): Promise<Record<string, string>> {
  const { features, revision } = dependency()
  assertLockfile(revision)

  // `compile` remaps Cargo paths out of panic locations; `assertPortable`
  // verifies none survived.
  const compiled = compile(revision)
  const optimized = path.join(buildDir, 'ox_evm2.opt.wasm')
  const wasmOpt = resolveWasmOpt()
  child_process.execFileSync(
    wasmOpt,
    [
      '-Oz',
      // Rust strips the `target_features` section, so the features it compiled
      // against have to be named here for `wasm-opt` to accept the module.
      '--enable-bulk-memory',
      '--enable-bulk-memory-opt',
      '--enable-multivalue',
      '--enable-mutable-globals',
      '--enable-nontrapping-float-to-int',
      '--enable-reference-types',
      '--enable-sign-ext',
      '--strip-debug',
      '--strip-producers',
      '--strip-target-features',
      compiled.artifact,
      '-o',
      optimized,
    ],
    { stdio: 'inherit' },
  )

  const bytes = new Uint8Array(fs.readFileSync(optimized))
  assertPortable(bytes)
  if (bytes.length > maxBytes)
    throw new Error(
      `The artifact is ${bytes.length} bytes, over its ${maxBytes} byte budget. Shrink it, or raise \`maxBytes\` in \`scripts/wasm/build-evm2.ts\` deliberately.`,
    )

  const gzip = zlib.gzipSync(bytes, { level: 9 }).length
  const brotli = zlib.brotliCompressSync(bytes).length
  const base64 = Buffer.from(bytes).toString('base64').length
  const wasmOptVersion = child_process
    .execFileSync(wasmOpt, ['--version'], { encoding: 'utf8' })
    .trim()

  console.log(
    `evm2  ${bytes.length} B wasm → ${base64} B base64 → ${gzip} B gzip → ${brotli} B brotli (budget ${maxBytes} B)`,
  )

  return {
    ...Object.fromEntries(
      Object.entries(compiled.licenses).map(([file, text]) => [
        `wasm/evm2/${file}`,
        text,
      ]),
    ),
    [notice]: attribution(revision, compiled.metadata),
    [out]: template(bytes, {
      features,
      gzip,
      revision,
      toolchain: compiled.rustc,
      wasmOpt: wasmOptVersion,
    }),
  }
}
