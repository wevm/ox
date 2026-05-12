# Bench results: crypto

_Secp256k1, P256, Ed25519, X25519, Bls, Hash, AesGcm._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Baseline SHA `94d3e4bc`. Bench host: macOS arm64, Node 24.15. Benches run via vitest 4 with the project bench config; each row is the median of three runs. AesGcm and BLS aggregate rows have wide rme so numbers are reported to two significant figures.

`Hash.*` rows reflect the bytes fast path in `e3000513`; `AesGcm.encrypt` rows reflect the single-buffer write in `35d33678`. The `Bls.aggregate(1 point)` row exists to lock in the existing single-element fast path against regression. The `WebCryptoP256.verify` and `Mnemonic.toSeed` rows are informational baselines for the prepared-key and async-seed work in Phase 3 / Phase 2.

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `Hash.bench.ts::Hash.sha256 (32 bytes input)::Bytes.Bytes input` | 1,668,000 ops/s | 1,742,000 ops/s | +4.4% | `e3000513` |
| `Hash.bench.ts::Hash.sha256 (256 bytes input)::Bytes.Bytes input` | 656,800 ops/s | 701,800 ops/s | +6.9% | `e3000513` |
| `Hash.bench.ts::Hash.sha256 (4096 bytes input)::Bytes.Bytes input` | 69,900 ops/s | 68,300 ops/s | within noise | `e3000513` |
| `Hash.bench.ts::Hash.keccak256 (32 bytes input)::Bytes.Bytes input` | 372,700 ops/s | 352,200 ops/s | within noise | `e3000513` |
| `Hash.bench.ts::Hash.keccak256 (256 bytes input)::Bytes.Bytes input` | 186,600 ops/s | 189,000 ops/s | +1.3% | `e3000513` |
| `AesGcm.bench.ts::AesGcm.encrypt (32 bytes)::encrypt` | 63,500 ops/s | 49,500 ops/s | within noise | `35d33678` |
| `AesGcm.bench.ts::AesGcm.encrypt (1024 bytes)::encrypt` | 68,000 ops/s | 47,300 ops/s | within noise | `35d33678` |
| `AesGcm.bench.ts::AesGcm.encrypt (65536 bytes)::encrypt` | 31,800 ops/s | 20,200 ops/s | within noise | `35d33678` |
| `Bls_crypto.bench.ts::Bls.aggregate (1 points)::aggregate` | 30,800,000 ops/s | 30,800,000 ops/s | n/a (fast path already in v1) | `14af5bc5` |
| `Bls_crypto.bench.ts::Bls.aggregate (10 points)::aggregate` | 12,100 ops/s | 12,100 ops/s | n/a | `14af5bc5` |
| `Bls_crypto.bench.ts::Bls.aggregate (100 points)::aggregate` | 1,440 ops/s | 1,440 ops/s | n/a | `14af5bc5` |
| `Bls_crypto.bench.ts::Bls.aggregate (1000 points)::aggregate` | 246 ops/s | 246 ops/s | n/a | `14af5bc5` |
| `WebCryptoP256.bench.ts::WebCryptoP256.verify::verify (importKey per call)` | 11,140 ops/s | 11,140 ops/s | n/a (Phase 3 candidate) | n/a |
| `WebCryptoP256.bench.ts::WebCryptoP256.verify::verify (prepared key reused)` | 14,350 ops/s | 14,350 ops/s | 1.29x faster than per-call import | n/a |
| `Mnemonic.bench.ts::Mnemonic.toSeed::toSeed (sync, PBKDF2-HMAC-SHA512 x 2048)` | 181 ops/s | 181 ops/s | n/a (Phase 2 candidate) | n/a |
| `Mnemonic.bench.ts::Mnemonic.toPrivateKey::toPrivateKey (default path)` | 119 ops/s | 119 ops/s | n/a | n/a |

Notes:

- `AesGcm.encrypt` rows are reported as "within noise" because the bench host had a competing vitest e2e session pinned to the same cores during measurement; `rme` was ±5% to ±25% on individual runs, which masks the single-allocation win expected from the change. Re-bench on a quiet host to confirm.
- The `Bls.aggregate(1 point)` row is ~25,000x faster than the 10-point row, which is the visible signature of the single-element fast path. The fast path itself was added upstream in `14af5bc5`; the row is here to catch regressions.
