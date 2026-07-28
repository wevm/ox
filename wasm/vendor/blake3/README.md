# BLAKE3

Portable C sources vendored from BLAKE3 1.8.5 at commit
`93a431c78a52d7ccf0f366f106467f5070e6075e`.

Upstream: https://github.com/BLAKE3-team/BLAKE3

License: CC0 1.0 Universal, see `LICENSE_CC0`.

Only the five files required by the portable implementation are included:

| File | SHA-256 |
| --- | --- |
| `blake3.c` | `b118ddf7cf9e6e5ef3fded72dcb1acf9dfdc4ea923cbe4605900ad6ee9afe1af` |
| `blake3_dispatch.c` | `134f21550138c0af6312925c988aeee35df287e4119e8ad1d206fccdb2238fe3` |
| `blake3_portable.c` | `2bc25b0dad67b4329d0b49cfa075ab2b0d04e424addbddc4e9c389c52a192524` |
| `blake3.h` | `df32c1e80577eabaab8ca9ba3b8be273bc2201a8cff6276c62cd8deba15f9348` |
| `blake3_impl.h` | `d388dca3574602c8849805ea3c8c0a12d082ac0e428756f305e111942f099af4` |

The target disables architecture-specific SIMD and atomics. Update the pinned
revision and checksums together, then run `pnpm wasm:build --target=blake3`.
