# Bench results: abi

_Abi, AbiConstructor, AbiError, AbiEvent, AbiFunction, AbiItem, AbiParameters._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Phase 1 perf foundations. Baseline: `94d3e4bc`. PR: `5fe9d65a`.

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `AbiParameters.bench.ts::AbiParameters.encode::(uint256[1000])` | 2,798 ops/s | 2,919 ops/s | +4.3% | `5fe9d65a` |
| `AbiParameters.bench.ts::AbiParameters.encode::(address[100])` | 40,192 ops/s | 43,998 ops/s | +9.5% | `5fe9d65a` |
| `AbiParameters.bench.ts::AbiParameters.encode::(string) 1KB` | 95,978 ops/s | 95,482 ops/s | -0.5% | `5fe9d65a` |
| `AbiParameters.bench.ts::AbiParameters.encode::nested (tuple, tuple, tuple)` | 390,371 ops/s | 395,981 ops/s | +1.4% | `5fe9d65a` |
| `AbiParameters.bench.ts::AbiParameters.decode::(uint256[1000])` | 1,189 ops/s | 1,230 ops/s | +3.4% | `5fe9d65a` |
| `AbiParameters.bench.ts::AbiParameters.decode::(address[100])` | 15,041 ops/s | 15,955 ops/s | +6.1% | `5fe9d65a` |
| `AbiParameters.bench.ts::AbiParameters.decode::(string) 1KB` | 61,870 ops/s | 62,012 ops/s | +0.2% | `5fe9d65a` |
| `AbiParameters.bench.ts::AbiParameters.decode::nested (tuple, tuple, tuple)` | 145,740 ops/s | 150,436 ops/s | +3.2% | `5fe9d65a` |
| `AbiFunction.bench.ts::AbiFunction.encodeData::erc20.transfer` | 1,378,487 ops/s | 1,418,232 ops/s | +2.9% | `5fe9d65a` |
| `AbiFunction.bench.ts::AbiFunction.encodeData::erc20.transferFrom` | 1,107,972 ops/s | 1,112,394 ops/s | +0.4% | `5fe9d65a` |
| `AbiFunction.bench.ts::AbiFunction.decodeData::erc20.transfer` | 538,874 ops/s | 561,790 ops/s | +4.3% | `5fe9d65a` |
| `AbiFunction.bench.ts::AbiFunction.decodeData::erc20.transferFrom` | 305,198 ops/s | 399,397 ops/s | +30.9% | `5fe9d65a` |
| `AbiItem.bench.ts::AbiItem.fromAbi (selector)::200-item ABI: last function` | 1,174 ops/s | 1,308 ops/s | +11.4% | `5fe9d65a` |
| `AbiItem.bench.ts::AbiItem.fromAbi (selector)::200-item ABI: first function` | 1,198 ops/s | 120,160 ops/s | +9930% (~100x) | `5fe9d65a` |
| `AbiItem.bench.ts::AbiItem.fromAbi (name)::200-item ABI: last function by name` | 107,822 ops/s | 109,894 ops/s | +1.9% | `5fe9d65a` |
| `AbiEvent.bench.ts::AbiEvent.encode::Transfer` | 1,422,697 ops/s | 2,831,470 ops/s | +99.0% (~2.0x) | `5fe9d65a` |
| `AbiEvent.bench.ts::AbiEvent.decode::Transfer` | 325,986 ops/s | 843,813 ops/s | +158.8% (~2.6x) | `5fe9d65a` |
