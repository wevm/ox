# Bench results: tempo

_All `src/tempo/*` modules._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Baseline SHA: `94d3e4bc` (origin/v1). All numbers in ops/s, taken from
`pnpm bench --run --project tempo-unit src/tempo` on darwin/arm64
(Node 24.15.0). Re-runs of noisy benches were averaged.

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `VirtualAddress.bench.ts::VirtualAddress.parse::hex address` | 4,449,465 | 4,228,085 | -5.0% | `75d6cd5a` |
| `VirtualMaster.bench.ts::VirtualMaster.getRegistrationHash::hex address, hex salt` | 241,464 | 243,487 | +0.8% | `75d6cd5a` |
| `VirtualMaster.bench.ts::VirtualMaster.getRegistrationHash::hex address, bytes salt` | 235,987 | 284,045 | +20.4% | `75d6cd5a` |
| `TokenId.bench.ts::TokenId.compute::hex sender` | 197,876 | 270,508 | +36.7% | `75d6cd5a` |
| `TokenId.bench.ts::TokenId.fromAddress::hex address` | 7,323,405 | 12,687,434 | +73.2% | `75d6cd5a` |
