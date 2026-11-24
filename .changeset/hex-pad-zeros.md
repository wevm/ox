---
"ox": patch
---

Improved `Hex.padLeft`, `Hex.padRight` and sized hex encoding (`Hex.fromBytes`, `Hex.fromString`, `Hex.fromNumber` with `size`) performance: padding a `0x`-prefixed value by up to 32 bytes slices a literal of zeros instead of building one (`padLeft` 60 → 11 ns, `padRight` 66 → 7 ns).
