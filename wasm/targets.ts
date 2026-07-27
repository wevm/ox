/**
 * WASM build targets.
 *
 * The single source of truth for how each artifact is compiled. `wasm:build`
 * writes each target to its `out` path as base64 inside a TypeScript module, and
 * `wasm:check` rebuilds and diffs against what is committed -- so any change
 * here must be followed by `pnpm wasm:build`.
 */
export type Target = {
  /** Extra `clang` flags, beyond the common set in `scripts/wasm/build.ts`. */
  cflags?: readonly string[] | undefined
  /** Preprocessor defines. */
  defines?: Readonly<Record<string, string | number>> | undefined
  /**
   * Additional named constants to template into the generated module, so that
   * values baked into the C are not duplicated by hand on the JS side.
   */
  extra?: Readonly<Record<string, string>> | undefined
  /** Include directories, relative to the repository root. */
  includes?: readonly string[] | undefined
  /** Initial linear memory, in bytes. Must exceed the target's static data. */
  initialMemory: number
  /**
   * Hard ceiling on the compiled artifact, in bytes. The build fails when
   * exceeded, so a size regression cannot land unnoticed.
   */
  maxBytes: number
  /** Maximum linear memory, in bytes. Omit to allow growth to 4 GiB. */
  maxMemory?: number | undefined
  /** Target name, as passed to `--target=`. */
  name: string
  /** Generated module path, relative to the repository root. */
  out: string
  /** Sources, relative to the repository root. */
  sources: readonly string[]
  /**
   * Shadow stack size, in bytes. WASM has no guard page, so an overflow
   * silently corrupts the data segment instead of trapping -- prefer generous.
   */
  stackSize?: number | undefined
  /** `wasm-opt` flags. */
  wasmOpt?: readonly string[] | undefined
}

export const targets = [
  {
    initialMemory: 1_048_576,
    maxBytes: 32_768,
    maxMemory: 67_108_864,
    name: 'hashes',
    out: 'src/wasm/internal/hashes.wasm.ts',
    sources: ['wasm/src/hashes.c', 'wasm/src/ox_rt.c'],
  },
  {
    initialMemory: 131_072,
    maxBytes: 8_192,
    maxMemory: 131_072,
    name: 'mine',
    out: 'src/tempo/internal/mine.wasm.ts',
    sources: ['wasm/src/mine.c', 'wasm/src/ox_rt.c'],
  },
] as const satisfies readonly Target[]
