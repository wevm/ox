# Bench results: foundations

_Bytes, Hex, Hash, Rlp leaf primitives._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Numbers below come from `pnpm bench --run` on the indicated suite, `core`
project only, on macOS arm64 / Node 24. Baseline = `origin/v1`
(`94d3e4bc`). PR = `c3d2eff6` (track-b/encoding tip). The big jumps on
hex round-trips are driven by the Phase 2 `Uint8Array.prototype.toHex` /
`Uint8Array.fromHex` native fast path.

## Bytes

| bench                          | baseline ops/s | PR ops/s   | delta  | SHA      |
| ------------------------------ | -------------- | ---------- | ------ | -------- |
| `Bytes.fromHex` 32 bytes       | 2,027,910      | 8,042,024  | +297%  | c3d2eff6 |
| `Bytes.fromHex` 256 bytes      | 252,425        | 3,950,156  | +1465% | c3d2eff6 |
| `Bytes.fromHex` 4096 bytes     | 14,657         | 367,100    | +2404% | c3d2eff6 |
| `Bytes.toHex` 32 bytes         | 7,485,665      | 9,877,120  | +32%   | c3d2eff6 |
| `Bytes.toHex` 256 bytes        | 1,336,954      | 8,216,234  | +515%  | c3d2eff6 |
| `Bytes.toHex` 4096 bytes       | 90,982         | 1,921,755  | +2012% | c3d2eff6 |
| `Bytes.concat` two small       | 18,763,205     | 19,326,910 | flat   | c3d2eff6 |
| `Bytes.concat` eight small     | 4,925,238      | 4,905,531  | flat   | c3d2eff6 |
| `Bytes.fromString` short ASCII | (n/a)          | 6,466,112  | n/a    | c3d2eff6 |

## Hex

| bench                                       | baseline ops/s | PR ops/s   | delta  | SHA      |
| ------------------------------------------- | -------------- | ---------- | ------ | -------- |
| `Hex.fromBytes` 32 bytes                    | 7,394,623      | 9,592,046  | +30%   | c3d2eff6 |
| `Hex.fromBytes` 256 bytes                   | 1,418,519      | 8,214,013  | +479%  | c3d2eff6 |
| `Hex.fromBytes` 4096 bytes                  | 94,068         | 1,920,853  | +1942% | c3d2eff6 |
| `Hex.toBytes` 32 bytes                      | 2,011,848      | 8,264,630  | +311%  | c3d2eff6 |
| `Hex.toBytes` 256 bytes                     | 251,148        | 3,968,791  | +1480% | c3d2eff6 |
| `Hex.toBytes` 4096 bytes                    | 15,503         | 391,177    | +2423% | c3d2eff6 |
| `Hex.concat` two small                      | 17,966,855     | 38,346,791 | +113%  | c3d2eff6 |
| `Hex.concat` eight small                    | 5,912,110      | 6,646,439  | +12%   | c3d2eff6 |
| `Hex.fromNumber` small (no size)            | 18,701,343     | 28,497,530 | +52%   | c3d2eff6 |
| `Hex.fromNumber` safe-int fast path size 32 | 6,569,224      | 6,839,570  | flat   | c3d2eff6 |
| `Hex.fromNumber` bigint size 32             | 6,233,503      | 6,420,315  | flat   | c3d2eff6 |
| `Hex.padLeft` 32 -> 32 (noop)               | 21,917,613     | 29,646,806 | +35%   | c3d2eff6 |
| `Hex.padLeft` 1 -> 32                       | 9,118,916      | 5,815,429  | -36%   | c3d2eff6 |
| `Hex.fromString` short ASCII                | 5,192,301      | 4,002,010  | -23%   | c3d2eff6 |
| `Hex.validate` (strict) 256 bytes           | 3,424,536      | 3,374,509  | flat   | c3d2eff6 |

## Rlp

_Pending: baseline run did not complete due to concurrent bench port
contention. PR-side numbers captured in `.bench/report.json` once
re-measured._
