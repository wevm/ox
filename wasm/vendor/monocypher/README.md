# Monocypher

This directory contains the exact Monocypher 4.0.3 sources needed by Ox's
Ed25519, X25519, and PBKDF2-HMAC-SHA512 WASM implementations.

- Repository: https://github.com/LoupVaillant/Monocypher
- Tag: `4.0.3`
- Commit: `ab2b16dd619ad5f6979a4fbe69cfa324a6fcc35f`
- License: BSD-2-Clause OR CC0-1.0

## Checksums

```text
a5781770269d2516e52ba4863f790c10a16da4089a1e81823aee19ff1e9026b0  LICENCE.md
f1f838cdd483bdebe0df0ff5c5ed60535e496f769c6a2f933ac4c0b114207123  monocypher.c
fcaf6ed771358bb4f40fba016f6518ae86ec02b1b877d2cc35ad92d3a26fd7b3  monocypher.h
ce0d2f8e32ca8f66398ba5b3456cc74327c3eff14e7b950ce7d57be9025cc453  monocypher-ed25519.c
3a3035181f991a158d0e1c7567258f0bae8ba0f1f23c5512b4a1db1b3c9730ce  monocypher-ed25519.h
```

## Updating

Check out the intended upstream tag, verify its commit, then replace only these
five files with their matching upstream paths. Update the checksums above, run
`pnpm wasm:build --target=crypto25519`, and inspect the source and artifact
diffs before running `pnpm wasm:check`.

## Security provenance

Monocypher's Cure53 audit covered version 3.1.1, not the 4.x series. Version
4.0.3 includes the June 2026 fix for a compiler-introduced EdDSA timing leak;
refer to Monocypher's [security disclosures](https://monocypher.org/quality-assurance/disclosures)
when updating.
