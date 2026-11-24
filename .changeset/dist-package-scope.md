---
"ox": patch
---

Gave `dist` its own `package.json` (`type` and `sideEffects` only), so Node no longer parses ox's whole `exports` map for every module it loads, which makes importing ox in Node about twice as fast (`ox` 260 → 125 ms, `ox/Hex` 11 → 6.5 ms).
