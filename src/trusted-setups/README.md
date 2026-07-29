# Trusted setup maintenance

Ox bundles the finalized Ethereum KZG ceremony output. This setup is not a
rolling network parameter, so a new `c-kzg-4844` release does not normally
change its points.

The committed `mainnet.source.json` records the reviewed `c-kzg-4844` release
tag, source path, source SHA-256, and generated JSON SHA-256.

## Refresh from c-kzg

1. Review the latest official
   [`c-kzg-4844` release](https://github.com/ethereum/c-kzg-4844/releases/latest)
   and its `src/trusted_setup.txt` changes. Do not update from a moving branch.
2. Pass the selected release tag explicitly:

   ```bash
   pnpm trusted-setups:update v2.1.8
   ```

   The command downloads that tagged file, requires 4,096 G1 Lagrange points,
   4,096 G1 monomial points, and 65 G2 monomial points, then regenerates the
   canonical JSON, source metadata, and packed TypeScript artifact.

3. Inspect the setup and metadata diff. Treat any point change as
   security-sensitive. An implementation-only `c-kzg-4844` release should
   change only the recorded tag when the source bytes are identical.
4. Verify the generated artifacts and KZG conformance:

   ```bash
   pnpm trusted-setups:check
   SKIP_GLOBAL_SETUP=1 pnpm test --project core --bail=1 \
     src/trusted-setups src/wasm/_test/Kzg.test.ts
   pnpm check:types
   ```

`mainnet.json` remains available for file-based consumers through
`Paths.mainnet`. `mainnet.ts` is the independently tree-shakeable packed
artifact behind `Setups.mainnet`.
