# Bench results: encoding

_Cbor, Json, CompactSize, Base32 / Base58 / Base64, Bech32m._

See [tasks/bench/README.md](../tasks/bench/README.md) for the convention.

Numbers below come from `pnpm bench --run` on the indicated suite, `core`
project only, on macOS arm64 / Node 24. Baseline = `origin/v1`
(`94d3e4bc`). PR = `c3d2eff6` (track-b/encoding tip).

## Base64

| bench                                | baseline ops/s | PR ops/s   | delta       | SHA      |
| ------------------------------------ | -------------- | ---------- | ----------- | -------- |
| `Base64.fromBytes` 32 bytes (padded) | 3,196,863      | 4,224,045  | +32%        | c3d2eff6 |
| `Base64.fromBytes` 256 bytes         | 1,571,379      | 2,117,780  | +35%        | c3d2eff6 |
| `Base64.fromBytes` 4096 bytes        | 185,611        | 242,788    | +31%        | c3d2eff6 |
| `Base64.fromBytes` 32 bytes (url)    | 2,920,138      | 3,365,584  | +15%        | c3d2eff6 |
| `Base64.toBytes` 32 bytes (padded)   | 3,293,632      | 7,172,709  | +118%       | c3d2eff6 |
| `Base64.toBytes` 256 bytes           | 842,228        | 1,078,274  | +28%        | c3d2eff6 |
| `Base64.toBytes` 4096 bytes          | 62,870         | 75,990     | +21%        | c3d2eff6 |
| `Base64.toBytes` 32 bytes (no pad)   | 3,448,068      | 6,232,964  | +81%        | c3d2eff6 |
| `Base64.toBytes` 32 bytes (url)      | 3,068,493      | 9,895,648  | +222%       | c3d2eff6 |
| `Base64.toString` hello              | 3,622,405      | 7,388,637  | +104%       | c3d2eff6 |
| `Base64.toString` lorem (768 chars)  | 368,166        | 622,463    | +69%        | c3d2eff6 |

## Json

| bench                                | baseline ops/s | PR ops/s   | delta       | SHA      |
| ------------------------------------ | -------------- | ---------- | ----------- | -------- |
| `Json.parse` small (no bigint)       | 1,127,912      | 5,591,907  | +396%       | c3d2eff6 |
| `Json.parse` medium 32 txs (no bigint) | 24,066       | 157,841    | +556%       | c3d2eff6 |
| `Json.parse` small with bigint       | 382,934        | 389,578    | flat        | c3d2eff6 |
| `Json.stringify` small               | 3,922,494      | 3,910,835  | flat        | c3d2eff6 |
| `Json.stringify` medium 32 txs       | 136,042        | 126,995    | -7%         | c3d2eff6 |
| `Json.canonicalize` small            | 2,770,818      | 2,702,280  | flat        | c3d2eff6 |
