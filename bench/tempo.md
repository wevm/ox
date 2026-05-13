# Bench results: tempo

_All `src/tempo/*` modules._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Baseline SHA: `94d3e4bc` (origin/v1). All numbers in ops/s, taken from
`pnpm bench --run --project tempo-unit src/tempo` on darwin/arm64
(Node 24.15.0). Re-runs of noisy benches were averaged.

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `TempoAddress.bench.ts::TempoAddress.resolve::hex passthrough` | 43,538,336 | 43,220,915 | -0.7% | `75d6cd5a` |
| `TempoAddress.bench.ts::TempoAddress.resolve::tempo prefix` | 3,687,568 | 3,693,680 | +0.2% | `75d6cd5a` |
| `TempoAddress.bench.ts::TempoAddress.unwrap::hex passthrough` | n/a (new) | 43,972,087 | new | `75d6cd5a` |
| `TempoAddress.bench.ts::TempoAddress.unwrap::tempo prefix` | n/a (new) | 12,178,808 | new (3.30x vs `resolve`) | `75d6cd5a` |
| `VirtualAddress.bench.ts::VirtualAddress.parse::hex address` | 4,449,465 | 4,228,085 | -5.0% | `75d6cd5a` |
| `VirtualAddress.bench.ts::VirtualAddress.parse::tempo address` | 1,997,542 | 3,193,111 | +59.9% | `75d6cd5a` |
| `VirtualMaster.bench.ts::VirtualMaster.getRegistrationHash::hex address, hex salt` | 241,464 | 243,487 | +0.8% | `75d6cd5a` |
| `VirtualMaster.bench.ts::VirtualMaster.getRegistrationHash::hex address, bytes salt` | 235,987 | 284,045 | +20.4% | `75d6cd5a` |
| `VirtualMaster.bench.ts::VirtualMaster.getRegistrationHash::tempo address, hex salt` | 229,003 | 234,485 | +2.4% | `75d6cd5a` |
| `TokenId.bench.ts::TokenId.compute::hex sender` | 197,876 | 270,508 | +36.7% | `75d6cd5a` |
| `TokenId.bench.ts::TokenId.compute::tempo sender` | 187,991 | 260,789 | +38.7% | `75d6cd5a` |
| `TokenId.bench.ts::TokenId.fromAddress::hex address` | 7,323,405 | 12,687,434 | +73.2% | `75d6cd5a` |
| `TokenId.bench.ts::TokenId.fromAddress::tempo address` | 2,374,826 | 7,023,025 | +195.7% | `75d6cd5a` |
