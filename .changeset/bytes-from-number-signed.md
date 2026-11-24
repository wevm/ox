---
"ox": patch
---

Made `Bytes.fromNumber` write signed safe integers of up to 6 bytes (and non-negative ones of any size) without BigInt, as it already did for unsigned ones: `Bytes.fromNumber(-32, { size: 1, signed: true })` goes from about 140 to 36 ns.
