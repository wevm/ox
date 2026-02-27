---
'ox': patch
---

Added `Base32`, `CompactSize`, and `TempoAddress` modules. `Base32` implements BIP-173 bech32 base32 encoding/decoding. `CompactSize` implements Bitcoin's variable-length integer encoding. `TempoAddress` provides human-readable Tempo address formatting and parsing with `tempo1`/`tempoz1` prefixes, CompactSize zone ID encoding, and double-SHA256 checksumming.
