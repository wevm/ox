---
"ox": patch
---

Made `Bytes.fromNumber` write its bytes directly instead of encoding the number as hex with `Hex.fromNumber` and decoding that: an unsigned safe integer that fits its `size` is written without BigInt arithmetic (about 2.5x faster with half the memory), and bundles that only encode numbers to bytes are about 30% smaller. A fractional `size` now throws for numbers as it already did for bigints. `Hex.fromNumber` pads a sized number in one step, with less memory.
