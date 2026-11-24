---
"ox": patch
---

Made `Bytes.fromNumber` write non-negative values up to 2^53 without BigInt arithmetic (about 3-4x faster), and larger values 32 bits per BigInt operation (about 3.5x faster for 200-bit values); the output and errors are unchanged.
