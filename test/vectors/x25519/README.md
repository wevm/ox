# X25519 vectors

`low-order.json` is the complete seven-entry small-order blacklist published by
libsodium 1.0.20. It includes zero, one, both nontrivial order-eight
coordinates, `p-1`, and the noncanonical `p` and `p+1` aliases.

- Source: https://github.com/jedisct1/libsodium/blob/1.0.20-RELEASE/src/libsodium/crypto_scalarmult/curve25519/ref10/x25519_ref10.c
- Analysis: https://eprint.iacr.org/2017/806

`index.ts` mirrors the JSON for browser fuzzing. The core conformance suite
asserts that both representations stay identical.
