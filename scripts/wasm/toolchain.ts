/**
 * Resolves the pinned native toolchain used to build the WASM artifacts.
 *
 * The artifacts are committed as base64, so their bytes must be reproducible. A
 * probe for whatever `clang` happens to be on `PATH` is not: output differs
 * between LLVM versions. So the toolchain is pinned in `wasm/toolchain.json`,
 * downloaded on demand, and verified by SHA-256.
 *
 * Usage:
 *   pnpm wasm:toolchain
 */

import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { pipeline } from 'node:stream/promises'
import * as child_process from 'node:child_process'

export const root = path.resolve(import.meta.dirname, '../..')

const cacheDir = path.join(root, '.wasm-toolchain')

type Toolchain = {
  binaryen: string
  rust: {
    digest: string
    image: string
    platform: string
  }
  wasiSdk: {
    assets: Record<string, { file: string; sha256: string }>
    release: string
    version: string
  }
}

export const toolchain: Toolchain = JSON.parse(
  fs.readFileSync(path.join(root, 'wasm/toolchain.json'), 'utf8'),
)

export type Resolved = {
  /** Path to the pinned `clang`. */
  clang: string
  /** Directory holding `libclang_rt.builtins-wasm32.a`. */
  clangRtDir: string
  /** Whether `clang` came from `OX_WASM_CLANG` rather than the pin. */
  overridden: boolean
  /** Human-readable toolchain identity, recorded in generated modules. */
  version: string
  /** Path to the pinned `wasm-opt`. */
  wasmOpt: string
}

function platformKey() {
  const key = `${process.platform}-${process.arch}`
  if (!toolchain.wasiSdk.assets[key])
    throw new Error(
      `No pinned wasi-sdk for \`${key}\`. Supported: ${Object.keys(
        toolchain.wasiSdk.assets,
      ).join(
        ', ',
      )}. Set \`OX_WASM_CLANG\` to build anyway (artifacts will not be byte-reproducible).`,
    )
  return key
}

async function download(url: string, to: string) {
  const response = await fetch(url)
  if (!response.ok || !response.body)
    throw new Error(`Failed to download ${url}: ${response.status}`)
  await pipeline(response.body as never, fs.createWriteStream(to))
}

function sha256(file: string) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

/** Downloads and verifies the pinned wasi-sdk, returning its install directory. */
export async function installWasiSdk(): Promise<string> {
  const key = platformKey()
  const asset = toolchain.wasiSdk.assets[key]!
  const dir = path.join(cacheDir, asset.file.replace(/\.tar\.gz$/, ''))
  if (fs.existsSync(path.join(dir, 'bin/clang'))) return dir

  fs.mkdirSync(cacheDir, { recursive: true })
  const archive = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'ox-wasi-sdk-')),
    asset.file,
  )
  const url = `https://github.com/WebAssembly/wasi-sdk/releases/download/${toolchain.wasiSdk.release}/${asset.file}`

  console.log(`Downloading ${url}...`)
  await download(url, archive)

  const digest = sha256(archive)
  if (digest !== asset.sha256)
    throw new Error(
      `Checksum mismatch for ${asset.file}.\n  expected ${asset.sha256}\n  actual   ${digest}`,
    )

  console.log(`Extracting to ${dir}...`)
  child_process.execFileSync('tar', ['-xzf', archive, '-C', cacheDir])
  fs.rmSync(path.dirname(archive), { force: true, recursive: true })

  if (!fs.existsSync(path.join(dir, 'bin/clang')))
    throw new Error(
      `Extracted archive did not contain \`bin/clang\` at ${dir}.`,
    )
  return dir
}

function findClangRt(sdkDir: string) {
  const base = path.join(sdkDir, 'lib/clang')
  for (const version of fs.readdirSync(base)) {
    const dir = path.join(base, version, 'lib/wasip1')
    if (fs.existsSync(path.join(dir, 'libclang_rt.builtins-wasm32.a')))
      return dir
  }
  throw new Error(
    `Could not find \`libclang_rt.builtins-wasm32.a\` under ${base}. Anything using \`__int128\` will fail to link without it.`,
  )
}

/**
 * Resolves the pinned `wasm-opt`.
 *
 * Exported because the Rust adapter needs the same optimizer without the
 * wasi-sdk `resolve` installs for the C targets.
 */
export function resolveWasmOpt() {
  // The `binaryen` npm package ships a prebuilt `wasm-opt` for every platform,
  // and pnpm pins its version -- which is what makes `-O4` output reproducible.
  const wasmOpt = path.join(root, 'node_modules/binaryen/bin/wasm-opt')
  if (!fs.existsSync(wasmOpt))
    throw new Error(
      'Could not find `wasm-opt`. Run `pnpm install` to fetch the pinned `binaryen`.',
    )
  const version = child_process
    .execFileSync(wasmOpt, ['--version'], { encoding: 'utf8' })
    .trim()
  if (!version.includes(toolchain.binaryen))
    throw new Error(
      `\`wasm-opt\` is version \`${version}\`, but \`wasm/toolchain.json\` pins binaryen \`${toolchain.binaryen}\`.`,
    )
  return wasmOpt
}

/**
 * Resolves the toolchain, installing the pinned wasi-sdk if necessary.
 *
 * `OX_WASM_CLANG` overrides the pinned compiler. That is for local
 * experimentation only -- `wasm:check` refuses to verify against an overridden
 * toolchain, because its output is not guaranteed to match the committed bytes.
 */
export async function resolve(): Promise<Resolved> {
  const wasmOpt = resolveWasmOpt()
  const override = process.env.OX_WASM_CLANG

  if (override) {
    console.warn(
      `warning: using \`${override}\` from OX_WASM_CLANG instead of the pinned wasi-sdk ${toolchain.wasiSdk.version}. Artifacts may not be byte-reproducible.`,
    )
    return {
      clang: override,
      clangRtDir: process.env.OX_WASM_CLANG_RT ?? '',
      overridden: true,
      version: child_process
        .execFileSync(override, ['--version'], { encoding: 'utf8' })
        .split('\n')[0]!
        .trim(),
      wasmOpt,
    }
  }

  const sdkDir = await installWasiSdk()
  return {
    clang: path.join(sdkDir, 'bin/clang'),
    clangRtDir: findClangRt(sdkDir),
    overridden: false,
    version: `wasi-sdk ${toolchain.wasiSdk.version}`,
    wasmOpt,
  }
}

if (import.meta.filename === process.argv[1]) {
  const resolved = await resolve()
  console.log(`clang:    ${resolved.clang}`)
  console.log(`builtins: ${resolved.clangRtDir}`)
  console.log(`wasm-opt: ${resolved.wasmOpt}`)
  console.log(`version:  ${resolved.version}`)
}
