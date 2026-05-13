# Bench results: foundations

_Bytes, Hex, Hash, Rlp leaf primitives._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Baseline: `94d3e4bc` (`origin/v1`). PR: `track-b/foundations`. Numbers in ops/sec from `pnpm vitest bench --project core` on the same machine. Delta is `(PR / baseline) - 1`.

| bench | baseline | PR | delta | SHA |
| ----- | -------- | -- | ----- | --- |
| `Bytes.bench.ts::Bytes.fromNumber({ size: 32 })::bigint, max` | 1,225,360 | 1,225,997 | +0.05% | 82be3ad5 |
| `Bytes.bench.ts::Bytes.fromNumber({ size: 32 })::bigint, small` | 1,171,817 | 10,207,393 | +771% | 82be3ad5 |
| `Bytes.bench.ts::Bytes.fromNumber({ size: 32 })::number` | 1,130,334 | 10,197,954 | +802% | 82be3ad5 |
| `Bytes.bench.ts::Bytes.fromNumber({ size: 32 })::bigint, max u32` | 1,128,445 | 7,246,790 | +542% | 82be3ad5 |
| `Bytes.bench.ts::Bytes.toBigInt::32 bytes` | 3,291,487 | 9,988,153 | +203% | 82be3ad5 |
| `Bytes.bench.ts::Bytes.toBigInt::32 bytes (zero)` | 3,808,801 | 14,470,733 | +280% | 82be3ad5 |
| `Bytes.bench.ts::Bytes.toBigInt::32 bytes, size: 32` | 2,487,890 | 8,667,941 | +248% | 82be3ad5 |
| `Hex.bench.ts::Hex.concat::2 args` | 15,956,622 | 35,163,183 | +120% | 82be3ad5 |
| `Hex.bench.ts::Hex.concat::3 args` | 12,542,139 | 25,015,271 | +99% | 82be3ad5 |
| `Hex.bench.ts::Hex.concat::8 args` | 4,643,717 | 13,828,740 | +198% | 82be3ad5 |
| `Hex.bench.ts::Hex.slice::positive start, no end` | 16,990,555 | 15,273,499 | -10% | 82be3ad5 |
| `Hex.bench.ts::Hex.slice::positive start + end` | 24,106,798 | 30,023,615 | +25% | 82be3ad5 |
| `Hex.bench.ts::Hex.slice::negative start` | 23,095,156 | 32,018,333 | +39% | 82be3ad5 |
