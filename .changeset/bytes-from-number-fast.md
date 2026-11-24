---
"ox": patch
---

Made `Bytes.fromNumber` write non-negative values up to 2^53, and negative signed values of up to 6 bytes, without BigInt arithmetic (about 3-4x faster for non-negative values and 3x faster for negative ones), and larger values 32 bits per BigInt operation (about 3.5x faster for 200-bit values); the output and errors are unchanged.
