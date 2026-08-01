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

const hmacSha256ScratchSize = 144
const hmacSha256StateSize = hmacSha256ScratchSize
const keccak256StateSize = 344
const pbkdf2Sha256ScratchSize = 352
const ripemd160StateSize = 96
const sha256StateSize = 112
const blake3StateSize = 1_912
// Leave almost 1 MiB above Noble's workspace limit for the stack, copied
// inputs, output, and fixed scratch.
const scryptMaxMemory = 1_074_790_400
const scryptHmacSha256ScratchSize = 544
const scryptScratchSize = scryptHmacSha256ScratchSize + 128

export const targets = [
  {
    defines: {
      HMAC_SHA256_SCRATCH_SIZE: hmacSha256ScratchSize,
      HMAC_SHA256_STATE_SIZE: hmacSha256StateSize,
      KECCAK256_STATE_SIZE: keccak256StateSize,
      PBKDF2_SHA256_SCRATCH_SIZE: pbkdf2Sha256ScratchSize,
      RIPEMD160_STATE_SIZE: ripemd160StateSize,
      SHA256_STATE_SIZE: sha256StateSize,
    },
    extra: {
      hmacSha256ScratchSize: String(hmacSha256ScratchSize),
      hmacSha256StateSize: String(hmacSha256StateSize),
      keccak256StateSize: String(keccak256StateSize),
      pbkdf2Sha256ScratchSize: String(pbkdf2Sha256ScratchSize),
      ripemd160StateSize: String(ripemd160StateSize),
      sha256StateSize: String(sha256StateSize),
    },
    initialMemory: 1_048_576,
    maxBytes: 32_768,
    name: 'hashes',
    out: 'src/wasm/internal/hashes.wasm.ts',
    sources: ['wasm/src/hashes.c', 'wasm/src/ox_rt.c'],
  },
  {
    cflags: ['-include', 'blake3_compat.h'],
    defines: {
      BLAKE3_ATOMICS: 0,
      BLAKE3_NO_AVX2: 1,
      BLAKE3_NO_AVX512: 1,
      BLAKE3_NO_NEON: 1,
      BLAKE3_NO_SSE2: 1,
      BLAKE3_NO_SSE41: 1,
      BLAKE3_STATE_SIZE: blake3StateSize,
    },
    extra: {
      blake3StateSize: String(blake3StateSize),
    },
    includes: ['wasm/shim/blake3', 'wasm/vendor/blake3'],
    initialMemory: 131_072,
    maxBytes: 24_576,
    maxMemory: 4_294_967_296,
    name: 'blake3',
    out: 'src/wasm/internal/blake3.wasm.ts',
    sources: [
      'wasm/src/blake3.c',
      'wasm/vendor/blake3/blake3.c',
      'wasm/vendor/blake3/blake3_dispatch.c',
      'wasm/vendor/blake3/blake3_portable.c',
      'wasm/src/ox_rt.c',
    ],
    stackSize: 65_536,
  },
  {
    defines: {
      SCRYPT_SCRATCH_SIZE: scryptScratchSize,
    },
    extra: {
      scryptMaxMemory: String(scryptMaxMemory),
      scryptScratchSize: String(scryptScratchSize),
    },
    initialMemory: 131_072,
    maxBytes: 8_192,
    maxMemory: scryptMaxMemory,
    name: 'scrypt',
    out: 'src/wasm/internal/scrypt.wasm.ts',
    sources: ['wasm/src/scrypt.c', 'wasm/src/ox_rt.c'],
    stackSize: 65_536,
  },
  {
    includes: ['wasm/vendor/monocypher'],
    initialMemory: 262_144,
    maxBytes: 53_248,
    maxMemory: 4_294_967_296,
    name: 'crypto25519',
    out: 'src/wasm/internal/crypto25519.wasm.ts',
    sources: [
      'wasm/src/crypto25519.c',
      'wasm/vendor/monocypher/monocypher.c',
      'wasm/vendor/monocypher/monocypher-ed25519.c',
      'wasm/src/ox_rt.c',
    ],
    stackSize: 65_536,
  },
  {
    defines: {
      COMB_BLOCKS: 2,
      COMB_TEETH: 5,
      ECMULT_WINDOW_SIZE: 8,
      ENABLE_MODULE_ECDH: 1,
      ENABLE_MODULE_RECOVERY: 1,
      USE_FORCE_WIDEMUL_INT64: 1,
    },
    includes: ['wasm/vendor/secp256k1/include', 'wasm/vendor/secp256k1/src'],
    initialMemory: 262_144,
    maxBytes: 98_304,
    maxMemory: 4_294_967_296,
    name: 'secp256k1',
    out: 'src/wasm/internal/secp256k1.wasm.ts',
    sources: [
      'wasm/src/secp256k1.c',
      'wasm/vendor/secp256k1/src/precomputed_ecmult.c',
      'wasm/vendor/secp256k1/src/precomputed_ecmult_gen.c',
      'wasm/src/ox_rt.c',
    ],
    stackSize: 65_536,
  },
  {
    // Full LTO makes c-kzg trusted-setup initialization trap in WASM.
    cflags: ['-fno-lto'],
    defines: {
      __BLST_NO_ASM__: 1,
      __BLST_NO_CPUID__: 1,
      __BLST_PORTABLE__: 1,
    },
    includes: [
      'wasm/shim/kzg',
      'wasm/vendor/c-kzg-4844/src',
      'wasm/vendor/c-kzg-4844/blst/bindings',
      'wasm/vendor/c-kzg-4844/blst/src',
    ],
    initialMemory: 8_388_608,
    maxBytes: 196_608,
    maxMemory: 134_217_728,
    name: 'kzg',
    out: 'src/wasm/internal/kzg.wasm.ts',
    sources: [
      'wasm/src/kzg.c',
      'wasm/vendor/c-kzg-4844/src/ckzg.c',
      'wasm/vendor/c-kzg-4844/blst/src/server.c',
      'wasm/src/kzg_rt.c',
    ],
    stackSize: 1_048_576,
  },
  {
    defines: {
      MLD_CONFIG_CORE_API_ONLY: 1,
      MLD_CONFIG_NAMESPACE_PREFIX: 'mld44',
      MLD_CONFIG_NO_SUPERCOP: 1,
      MLD_CONFIG_PARAMETER_SET: 44,
    },
    includes: ['wasm/shim/mldsa', 'wasm/vendor/mldsa-native/mldsa'],
    initialMemory: 262_144,
    maxBytes: 49_152,
    maxMemory: 4_294_967_296,
    name: 'mldsa44',
    out: 'src/wasm/internal/mldsa44.wasm.ts',
    sources: [
      'wasm/src/mldsa44.c',
      'wasm/vendor/mldsa-native/mldsa/mldsa_native.c',
      'wasm/src/ox_rt.c',
    ],
    // ML-DSA-44 signing peaks at MLD_TOTAL_ALLOC_44_SIGN (44,704) bytes of
    // stack inside mldsa-native, plus the wrapper's expanded key pair.
    stackSize: 131_072,
  },
  {
    initialMemory: 131_072,
    maxBytes: 8_192,
    maxMemory: 131_072,
    name: 'mine',
    out: 'src/tempo/internal/mine.wasm.ts',
    sources: ['wasm/src/mine.c', 'wasm/src/ox_rt.c'],
  },
  {
    initialMemory: 131_072,
    maxBytes: 4_096,
    maxMemory: 131_072,
    name: 'runtime-test',
    out: 'src/wasm/_test/runtime.wasm.ts',
    sources: ['wasm/test/ox_rt.c', 'wasm/src/ox_rt.c'],
  },
] as const satisfies readonly Target[]
