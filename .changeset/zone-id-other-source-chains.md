---
"ox": patch
---

Fixed `ZoneId.fromChainId` for zones of Tempo chains other than mainnet and Moderato, whose chain IDs carry the source chain ID in the high 32 bits and the zone ID in the low 32 bits.
