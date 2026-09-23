# Funding Conformance Tests

Run the TIP-1120 integration suite with Docker running:

```sh
pnpm test run --project tempo-funding
```

The suite starts an isolated development node through the existing Prool harness and creates its own tokens, DEX liquidity, funding policies, and access keys. No public-network account or deployment is required.

- Image: `ghcr.io/tempoxyz/tempo@sha256:485e878fb0a68894ceb4743280f1d2747932ae3728e94cf51302d0cae5476f5a`
- Build: https://github.com/tempoxyz/tempo/actions/runs/35911644417
- Node revision: `492639758d54b83ddd68f4a4b7a67e5c51221c0e`
- Specification: `tempoxyz/tempo` TIP-1120 at `245acb48b13423ffeb84e2204bc8bcfcc61be663`
- Prool port: `3112`

The tests assert the node revision before submitting transactions. They cover owner and delegated funding, sponsorship, existing and inline policies, spending limits, source permissions, stale commitments, rollback, and key expiry/revocation. P256 and WebAuthn access keys use the same funding fields as secp256k1 keys.

The unit fixtures in `src/tempo/Funding.test.ts` also contain independent Rust RLP vectors. Reproduce them at the pinned node revision with:

```sh
cargo test -p tempo-primitives funding_requirement_golden
cargo test -p tempo-primitives policy_reference_has_canonical_trailing_encoding
```

Policy ABI encoding and commitment hashes are independently checked against `createPolicy`/`getPolicy` on the node. Signed transactions accepted by the node verify the sender and sponsor encodings against its Rust implementation.
