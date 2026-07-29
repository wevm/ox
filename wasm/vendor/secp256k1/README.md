# libsecp256k1

This directory contains the runtime source subset from Bitcoin Core's
libsecp256k1 v0.7.1 release.

- Release tag: `v0.7.1`
- Commit: `1a53f4961f337b4d166c25fce72ef0dc88806618`
- Source: <https://github.com/bitcoin-core/secp256k1>
- License: MIT, in `COPYING`

Ox enables only the ECDH and public-key recovery modules. The build selects the
portable 32-bit scalar implementation and size-conscious precomputation tables
in `wasm/targets.ts`.
