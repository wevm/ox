---
"ox": patch
---

Improved `Hex.padLeft`, `Hex.padRight` and sized hex encoding (`Hex.fromBytes`, `Hex.fromString`, `Hex.fromNumber` with `size`) performance: padding up to 32 bytes slices a literal of zeros instead of building one (`padRight` 55 → 11 ns, `padLeft` 65 → 28 ns).
