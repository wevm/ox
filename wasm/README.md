# WASM artifacts

C sources for ox's WASM crypto engines, and the build that turns them into the
base64 modules committed under `src/`.

Nothing here is published. `package.json#files` ships `dist` and `src`, so the C
lives outside `src/` deliberately — only the generated base64 modules reach npm.

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
| `secp256k1`    | `src/wasm/internal/secp256k1.wasm.ts` | `src/wasm/Secp256k1.ts` (`ox/wasm/Secp256k1`)    |
| `mine`         | `src/tempo/internal/mine.wasm.ts`     | `src/tempo/internal/virtualMasterPool.ts`        |
| `runtime-test` | `src/wasm/_test/runtime.wasm.ts`      | `src/wasm/_test/Runtime.test.ts` (test only)     |

## Building

```bash
pnpm wasm:build                  # every target
pnpm wasm:build --target=hashes  # one target
pnpm wasm:check                  # rebuild and diff against what is committed
```

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
- **`malloc` is a bump allocator and `free` is a no-op** (`ox_rt.c`). Allocation
  metadata lets `realloc` preserve bytes and grow the latest allocation in place.
  A target that allocates must be initialized before JS reads `heap_base`,
  because the allocator advances past what it hands out.
- **Every target is size-budgeted** by `maxBytes` in `targets.ts`. The build fails
  when a target exceeds it, so a size regression cannot land unnoticed.
- **`producers` and `target_features` sections are stripped** and their absence
  asserted. Both record how the module was compiled rather than what it does, and
  both vary with the toolchain.
- **Full `-flto`, never `-flto=thin`** — ThinLTO is not reliably deterministic.
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

## Security

WebAssembly provides no constant-time guarantees. The specification says nothing
about instruction timing, engines re-optimize functions once they are hot,
branchless C is not guaranteed to stay branchless, and data-cache timing is fully
exposed. These artifacts are not hardened against timing or cache side-channel
attacks — and neither is the JavaScript they replace.

Where HMAC inputs cross into linear memory, the loader zeroes its copied inputs
and explicit scratch buffer in a `finally` block, including after recoverable
WebAssembly traps. The exported `zero` writes through a `volatile` pointer so
LTO cannot elide it. That bounds how long key material sits somewhere a heap
snapshot could capture; it cannot clear caller-owned or runtime-managed state,
and it does not prevent side channels.
