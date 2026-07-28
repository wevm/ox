# Node and WASM Engine Expansion

Status: Implemented and verified

## Objective

Expand `ox/node` and `ox/wasm` beyond hashing where a provider can:

1. Match Ox's engine contract exactly.
2. Offer a material runtime, portability, or provider-policy benefit.
3. Preserve the audited default for every omitted primitive.

The engine contract has 38 primitives across eight slots in
`src/core/internal/engine.ts`. Engines are intentionally partial, so this work
should not fill slots merely to increase provider counts.

## Decisions

- Keep random secret-key generation on the default unless a provider offers a
  policy benefit. The default already uses the runtime CSPRNG.
- Do not add a primitive whose edge-case behavior differs from Ox's default.
- Do not implement asynchronous WASM KDFs by wrapping synchronous work in a
  promise. They must genuinely yield and isolate concurrent workspaces.
- Keep Node scrypt omitted while Ox's accepted parameter domain includes values
  OpenSSL rejects.
- Keep Node ECDSA signing, recovery, verification, and ECDH omitted where
  Node's output or option semantics differ from Ox.
- Give every WASM artifact a pinned source, reproducible build, explicit size
  budget, and trap-safe secret cleanup.

## Audit Checklist

Final speedups below were measured with `scripts/bench:engines.ts` on an Apple
M4 Max using Node.js 25.9.0. Provider counts and representative timings are
also recorded in the engine guide.

| Priority | Slot | Node checklist | WASM checklist | Benefits | Trade-offs and gates |
| --- | --- | --- | --- | --- | --- |
| P0 | `Keystore` | [x] Add AES-CTR encrypt/decrypt<br>[x] Add PBKDF2 sync/async<br>[x] Keep scrypt omitted | [x] Add synchronous PBKDF2-SHA256 using the existing hash core<br>[x] Defer AES, scrypt, and asynchronous KDFs | Node measured 10.66x faster for AES-128 encryption and 10.86x for PBKDF2. WASM PBKDF2 measured 2.38x faster. | Node/OpenSSL rejects Ox's current scrypt defaults `{ N: 262144, r: 1, p: 8 }`. WASM clears copied passwords, salts, results, and scratch after every call. |
| P0 | `Mnemonic` | [x] Add `toSeed` with native PBKDF2-SHA512 | [x] Share Monocypher SHA-512 with the curve artifact<br>[x] Add `toSeed` | Node measured 12.69x faster and WASM 3.00x faster. | Exact BIP-39 NFKD, UTF-8, word-count, salt, iteration, and 64-byte output behavior is covered by English, Japanese, and differential vectors. JavaScript strings cannot be explicitly cleared. |
| P0 | `X25519` | [x] Add `getPublicKey`<br>[x] Add `getSharedSecret`<br>[x] Keep default randomness | [x] Add `getPublicKey` and `getSharedSecret` with Monocypher<br>[x] Keep default randomness | Shared-secret calculation measured 12.71x faster with Node and 14.68x with WASM. | Node 22 uses RFC 8410 DER wrappers. RFC 7748, the complete libsodium low-order corpus, ignored-high-bit aliases, malformed inputs, and all-zero outputs are covered. |
| P1 | `Ed25519` | [x] Add `getPublicKey`, `sign`, and `toMontgomerySecret`<br>[x] Keep `verify`, `toMontgomery`, and randomness on the default | [x] Add public-key derivation, signing, verification, and private conversion<br>[x] Keep public conversion and randomness on the default | Node signing measured 4.85x faster. WASM verification measured 16.41x faster and passed all 196 ZIP-215 cases. | Node verification accepted only 12 of 196 ZIP-215 cases. Monocypher 4.0.3 produces a 49,260-byte raw artifact; its published audit covered 3.1.1. |
| P1 | `P256` | [x] Add benchmark-gated `getPublicKey` only<br>[x] Keep the other five primitives on the default | [x] Evaluate and defer a partial provider | Node public-key derivation measured 12.89x faster. | Node returns a 32-byte ECDH x-coordinate instead of Ox's 33-byte compressed point. No evaluated WASM provider reproduced the recovered deterministic signature contract. |
| P2 | `Secp256k1` | [x] Keep the complete slot on the default | [x] Prototype libsecp256k1<br>[x] Defer it | The prototype was fast and 40,932 bytes raw. | It did not yet reproduce arbitrary-payload normalization, variable extra entropy, and the complete Ox contract. Vendoring 4.3 MB across 98 files was not justified for a partial slice. |
| P2 | `Bls` | [x] Keep the complete slot on the default | [x] Prototype blst's portable C path<br>[x] Defer it | The viable prototype was 108,822 bytes raw and materially faster. | The repository's standard `-O3 -flto` configuration produced traps; `-O2 -fno-lto` worked but needs a broader correctness and toolchain investigation. |
| P3 | `Hash` | [x] Keep SHA-256, HMAC-SHA256, and RIPEMD-160<br>[x] Keep Keccak256 and BLAKE3 omitted | [x] Keep the existing four primitives<br>[x] Add official portable BLAKE3 | WASM BLAKE3 measured 2.87x faster at 32 bytes and 10.75x at 1 MiB. | The dedicated artifact is 20,796 bytes raw and 8,522 bytes gzip. It is pinned, import-free, reproducible, and covered by all 35 official vectors. |

## Implementation Plan

| Phase | Checklist | Exit gate |
| --- | --- | --- |
| 0. Contract fixtures | [x] Add shared cross-engine differential helpers<br>[x] Add ZIP-215, RFC 7748/8410, BIP-39, AES, PBKDF2, Ed25519, and P256 fixtures<br>[x] Cover malformed inputs, non-zero-offset views, output ownership, and input immutability | Every accepted override matches the default and independent vectors. Regression tests prove incompatible primitives remain absent. |
| 1. Node symmetric and mnemonic | [x] Add `src/node/Keystore.ts`<br>[x] Implement AES-128/192/256-CTR encrypt/decrypt<br>[x] Implement PBKDF2-SHA256 sync/async for arbitrary `dkLen`<br>[x] Add exact BIP-39 `toSeed`<br>[x] Compose both modules<br>[x] Leave scrypt absent | Node 22 and Node 25 pass vectors, differential tests, types, fuzzing, and the benchmark. Secret-bearing temporary output buffers are cleared after copying. |
| 2. Node curves | [x] Add Node 22-compatible RFC 8410 Ed25519/X25519 codecs<br>[x] Add partial X25519 and Ed25519 modules<br>[x] Add benchmark-gated P256 public-key derivation<br>[x] Keep incompatible primitives absent from the created type | The complete ZIP-215 corpus proves Node verification remains omitted. RFC, libsodium, and SEC2 vectors cover accepted curve operations. Fallbacks report `n/a`. |
| 3. WASM PBKDF2 | [x] Extend the existing SHA-256/HMAC target<br>[x] Add only synchronous `pbkdf2Sha256`<br>[x] Share the memoized hashes instance<br>[x] Use overflow-safe workspace arithmetic<br>[x] Clear every staged byte in `finally` | The 10,338-byte artifact is reproducible, within budget, import-free, browser-tested, and covered by success and forced-late-trap cleanup tests. |
| 4. WASM Ed25519, X25519, and mnemonic | [x] Pin and checksum Monocypher 4.0.3<br>[x] Record audit and disclosure provenance<br>[x] Add one combined artifact<br>[x] Run all 196 ZIP-215 cases<br>[x] Share SHA-512 for BIP-39<br>[x] Keep randomness on the default | The 49,260-byte artifact is reproducible, import-free, within budget, and passes published vectors, differential fuzzing, three-browser conformance, cleanup, and overflow tests. |
| 5. Larger WASM prototypes | [x] Prototype libsecp256k1<br>[x] Prototype portable blst<br>[x] Record contract gaps and artifact sizes<br>[x] Defer both | Neither provider met the exact-contract, maintenance, and toolchain gates for this slice. Prototypes remain outside the repository. |
| 6. Conditional backlog | [x] Prototype and accept official portable BLAKE3<br>[x] Evaluate and defer BearSSL AES<br>[x] Evaluate and defer partial WASM P256<br>[x] Defer asynchronous WASM KDFs and scrypt | BLAKE3 alone met the source, security-model, size, correctness, portability, and benchmark gates. |
| 7. Release accepted slices | [x] Add public exports and TSDoc<br>[x] Update exact return types and type tests<br>[x] Run `pnpm exports:update`<br>[x] Run core, Node 22, browser, type, fuzz, build, and reproducibility checks<br>[x] Run the full engine benchmark<br>[x] Update guide counts, timings, trade-offs, testing, and security<br>[x] Update the existing changeset | Generated reference pages, packed-consumer checks, formatting, lint, and the final scoped-diff audit passed. |

## Verification Gates

### Correctness

- Differential-test every implementation against Ox's default.
- Use independent published vectors rather than deriving expectations from the
  default alone.
- Verify exact output lengths, serialization, low-S behavior, recovery parity,
  NFKD handling, and invalid-input behavior.
- Test inputs backed by non-zero-offset `Uint8Array` views.
- Confirm outputs are fresh arrays and do not alias provider memory.

### Node compatibility

- Run the supported baseline Node 22 and the current Node release.
- Test active OpenSSL-provider differences where practical.
- Confirm missing curves and algorithms fail at engine creation or remain
  omitted rather than failing on the first application call.
- Keep threadpool contention in mind when benchmarking asynchronous PBKDF2.

### WASM security

- Copy secrets into explicit regions with checked offsets and lengths.
- Return copied results, then clear copied inputs, results, expanded keys, and
  scratch in `finally`.
- Test cleanup after success and forced late traps through the production
  wrapper.
- Do not claim constant-time protection. WebAssembly permits timing side
  channels.
- Generate randomness in the host runtime rather than importing a random source
  into WASM.

### Performance

- Use the existing complete harness in `scripts/bench:engines.ts`.
- Add AES-128 because it is the public keystore path.
- Add public-default PBKDF2 and scrypt parameter cases where the provider
  supports them.
- Record cold-start compilation, raw and gzip artifact size, and peak linear
  memory alongside operation throughput.
- For speed-only overrides, leave the default installed when the provider does
  not produce a material win on a representative workload.

## References

- [Node.js 22 Crypto](https://nodejs.org/download/release/latest-v22.x/docs/api/crypto.html)
- [RFC 7914: scrypt](https://www.rfc-editor.org/info/rfc7914/)
- [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [ZIP-215](https://zips.z.cash/zip-0215)
- [WebAssembly Security](https://webassembly.org/docs/security/)
- [Monocypher disclosures](https://monocypher.org/quality-assurance/disclosures)
- [HACL* supported algorithms](https://hacl-star.github.io/Supported.html)
- [libsecp256k1](https://github.com/bitcoin-core/secp256k1)
- [blst](https://github.com/supranational/blst)
- [BLAKE3](https://github.com/BLAKE3-team/BLAKE3)
