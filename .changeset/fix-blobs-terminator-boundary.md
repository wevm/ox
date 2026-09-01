---
"ox": patch
---

Fixed `Blobs.to` treating a `0x80` byte in a non-final blob as the terminator, silently truncating that blob and every subsequent blob. The terminator is only ever written into the last blob by `Blobs.from`, so decoding now only recognizes it there, matching viem's `fromBlobs`.
