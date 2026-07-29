# c-kzg-4844

Portable C sources vendored from `ethereum/c-kzg-4844` v2.1.7 at commit
`9f4bcc83cbb17b3dbc3432de7320790968143ab9`.

Upstream: https://github.com/ethereum/c-kzg-4844

The bundled `blst` sources are pinned by that release at commit
`e7f90de551e8df682f3cc99067d204d8b90d27ad`.

Only the c-kzg C implementation, required portable blst sources, headers, and
licenses are included. Ox's wrapper and allocator live under `wasm/src/`.

Both projects use the Apache License 2.0. See `LICENSE` and `blst/LICENSE`.
