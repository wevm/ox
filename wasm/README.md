# WASM artifacts

C sources for ox's WASM crypto engines, the Rust adapter for the evm2 execution
engine, and the builds that turn them into the base64 modules committed under
`src/`.

Nothing here is published. `package.json#files` ships `dist` and `src`, so the
sources live outside `src/` deliberately — only the generated base64 modules
reach npm.

The two builds are separate. C targets go through `pnpm wasm:build`; the Rust
adapter goes through `cargo` inside a pinned Docker image. `pnpm wasm:build` and
`pnpm wasm:check` drive both; `--target=` selects one. See [the evm2 adapter](#the-evm2-adapter) below.

## Layout

```
toolchain.json   pinned wasi-sdk + binaryen versions, with per-platform checksums
targets.ts       per-target sources, flags, memory sizes and size budgets
shim/            libc declarations for freestanding builds (-nostdlib gives us none)
src/             the C
test/            C entrypoints used only by regression-test artifacts
```

Generated artifacts, and the module that loads them:

| target         | artifact                              | consumed by                                      |
| -------------- | ------------------------------------- | ------------------------------------------------ |
| `hashes`       | `src/wasm/internal/hashes.wasm.ts`    | `src/wasm/Hash.ts` (`ox/wasm/Hash`)              |
| `scrypt`       | `src/wasm/internal/scrypt.wasm.ts`    | `src/wasm/Keystore.ts` (`ox/wasm/Keystore`)      |
| `secp256k1`    | `src/wasm/internal/secp256k1.wasm.ts` | `src/wasm/Secp256k1.ts` (`ox/wasm/Secp256k1`)    |
| `mldsa44`      | `src/wasm/internal/mldsa44.wasm.ts`   | `src/wasm/MlDsa44.ts` (`ox/wasm/MlDsa44`)        |
| `kzg`          | `src/wasm/internal/kzg.wasm.ts`       | `src/wasm/Kzg.ts` (`ox/wasm/Kzg`)                |
| `mine`         | `src/tempo/internal/mine.wasm.ts`     | `src/tempo/internal/virtualMasterPool.ts`        |
| `runtime-test` | `src/wasm/_test/runtime.wasm.ts`      | `src/wasm/_test/Runtime.test.ts` (test only)     |

## Building

```bash
pnpm wasm:build                  # every target, C and Rust
pnpm wasm:build --target=hashes  # one C target
pnpm wasm:build --target=evm2    # the Rust adapter only
pnpm wasm:check                  # rebuild and diff against what is committed
```

`--target=` decides which toolchains are needed: a C target never invokes
`cargo`, and `evm2` never downloads the wasi-sdk.

`wasm:build` downloads the pinned wasi-sdk into `.wasm-toolchain/` on first run
and verifies it by SHA-256. Neither script is wired into `build` or `postinstall`:
contributors who do not touch C never need a native toolchain.

`pnpm wasm:check` runs in CI. It is what keeps the committed base64 honest — the
salt miner's build script was once deleted while its generated module kept
pointing at it, leaving an artifact nobody could rebuild.

## Why the toolchain is pinned

Compiled bytes depend on the exact compiler. A probe for whatever `clang` is on
`PATH` produces different output on different machines, so `wasm:check` could
never pass. `toolchain.json` pins:

- **wasi-sdk** — used only as a pinned `clang` plus
  `libclang_rt.builtins-wasm32.a`. We compile freestanding: no wasi-libc, no
  `--target=wasm32-wasi`, no WASI imports. The builtins archive matters because
  clang defines `__SIZEOF_INT128__` for `wasm32`, so any `__int128` arithmetic
  emits calls to `__multi3`, and `-nostdlib` has nothing to satisfy them with.
- **binaryen** — via the npm package, which ships a prebuilt `wasm-opt` for every
  platform. pnpm pins the version, which is what makes `-O4` output reproducible.

Reproducibility is guaranteed for the pinned toolchain on the platforms in
`toolchain.json`. `OX_WASM_CLANG` overrides the compiler for local
experimentation; `wasm:check` refuses to run with it set.

Bumping either version is a deliberate PR that regenerates every artifact, which
makes a toolchain change reviewable as a diff.

## Conventions

- **Exports are declared in the C**, with
  `__attribute__((export_name("...")))` — never with `-Wl,--export=`, so the
  export list sits next to the code that defines it.
- **JS owns the memory above `heap_base`.** Exports take explicit pointers and
  lengths; there is no fixed-offset ABI and no allocation in the hot path. The
  exception is `mine`, which keeps its original fixed-offset layout: its I/O is
  84 bytes, it crosses the JS boundary once per million hashes, and its offsets
  are already shipped.
- **`malloc` is normally a bump allocator and `free` is a no-op** (`ox_rt.c`).
  Allocation metadata lets `realloc` preserve bytes and grow the latest
  allocation in place. KZG uses a reclaiming free-list allocator
  (`kzg_rt.c`) because one instance retains setup state across repeated calls.
  A target that allocates must initialize before JS reads `heap_base`.
- **Every target is size-budgeted** by `maxBytes` in `targets.ts`. The build fails
  when a target exceeds it, so a size regression cannot land unnoticed.
- **`producers` and `target_features` sections are stripped** and their absence
  asserted. Both record how the module was compiled rather than what it does, and
  both vary with the toolchain.
- **Full `-flto`, never `-flto=thin`** — ThinLTO is not reliably deterministic.
  KZG explicitly disables LTO because full LTO makes trusted-setup
  initialization trap.
- **Stack sizes are generous.** WASM has no guard page, so an overflow silently
  corrupts the data segment instead of trapping: a bug presents as a wrong answer
  rather than a crash.

## Adding a target

1. Write the C under `src/`, exporting with `export_name`.
2. Add an entry to `targets.ts`, including `maxBytes`.
3. `pnpm wasm:build --target=<name>` and commit the generated module.
4. Add a loader under `src/wasm/`, plus a differential test against
   `@noble/*` — that is the oracle, since it is audited and it is what ox ships
   by default.

## The evm2 adapter

`evm2/` is an Ox-owned Rust crate that binds a pinned
[`alloy-rs/evm2`](https://github.com/alloy-rs/evm2) revision to WebAssembly. It
owns the boundary and nothing behind it: a versioned binary ABI, a host adapter
for evm2's `Database` trait, failure encoding, and the runtime glue `no_std`
needs. EVM execution, gas accounting, transaction validation, journaling,
precompiles, and fork behavior stay evm2's.

```
evm2/Cargo.toml           the pinned evm2 revision and the features selected for it
evm2/Cargo.lock           committed, so the artifact rebuilds byte-for-byte
evm2/rust-toolchain.toml  pinned compiler and wasm32 target
evm2/NOTICE.md            generated attribution for everything the artifact links
evm2/src/abi.rs           ABI v1 header, reader, writer
evm2/src/database.rs      host imports implementing evm2's `Database`
evm2/src/error.rs         response statuses and handler-failure encoding
evm2/src/lib.rs           the engine, its exports, and request dispatch
```

evm2 is a Cargo git dependency resolved from Cargo's external cache. Its source
never enters this repository — no checkout, submodule, subtree, or vendored
directory.

```bash
pnpm wasm:build --target=evm2   # compile, optimize, write the generated module
pnpm wasm:check --target=evm2   # rebuild and diff against what is committed
cd wasm/evm2 && cargo test   # host-side ABI and failure-encoding tests
```

The artifact is `src/wasm/internal/evm2.wasm.ts`, loaded by
`src/evm/internal/bindings.ts`. `pnpm wasm:check` also verifies
`NOTICE.md`, `LICENSE-MIT`, and `LICENSE-APACHE`, all of which the build
generates.

### Conventions

- **The compile runs in a pinned Docker image.** `rustc` output is not
  byte-identical across host platforms, unlike the wasi-sdk `clang`: the same
  source, lockfile, and target differ by a few hundred bytes between macOS and
  Linux, so a host build can never satisfy `wasm:check`. `wasm/toolchain.json`
  pins the image by digest, which makes the artifact a function of the image, the
  lockfile, and the source. `wasm-opt` is host-stable and still runs natively.
  `OX_EVM2_NATIVE=1` builds on the host for fast local iteration; `wasm:check`
  refuses it, the same way it refuses `OX_WASM_CLANG`.
- **The toolchain is pinned as stable, deliberately.** evm2 selects a tail-call
  interpreter backend when it detects a nightly compiler, which needs unstable
  features WebAssembly cannot use. Stable resolves to `single_return`, the
  backend evm2 intends for wasm.
- **No `std`.** The `std` feature reaches `getrandom 0.2`, which refuses to
  compile for `wasm32-unknown-unknown`. `no_std` leaves the allocator and panic
  handler to the adapter, which is why it carries `dlmalloc` and a trapping
  `#[panic_handler]`.
- **Pure-Rust precompiles only.** No `c-kzg`, `blst`, `gmp`, `mcl`,
  `secp256k1`, or `aws-lc-rs`. KZG point evaluation falls back to arkworks, so
  Cancun onward is covered without a native backend.
- **Dependency paths are remapped out of the binary.** Panic locations
  otherwise embed the build machine's Cargo directory, which alone makes the
  bytes unreproducible elsewhere. The build asserts the home directory does not
  appear in the artifact.
- **The import list is exact.** The build fails on any import beyond the four
  host database reads, so nothing can quietly pull in WASI, threads, or
  randomness.
- **ABI v1 is the compatibility boundary.** evm2's Rust API is never exposed to
  TypeScript. `src/evm/internal/codec.ts` is the other half of `abi.rs`, and the
  two must move together.
- **`HandlerError` is matched exhaustively.** An evm2 revision that adds a
  variant fails to compile in `error.rs` rather than collapsing into a
  neighbouring one.

## Security

WebAssembly provides no constant-time guarantees. The specification says nothing
about instruction timing, engines re-optimize functions once they are hot,
branchless C is not guaranteed to stay branchless, and data-cache timing is fully
exposed. These artifacts are not hardened against timing or cache side-channel
attacks — and neither is the JavaScript they replace.

Where secrets cross into linear memory, the loader zeroes copied inputs,
outputs, and explicit workspaces in a `finally` block, including after
recoverable WebAssembly traps. The exported `zero` writes through a `volatile`
pointer so LTO cannot elide it. That bounds how long key material sits somewhere
a heap snapshot could capture; it cannot clear caller-owned or runtime-managed
state, and it does not prevent side channels.
