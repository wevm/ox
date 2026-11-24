---
"ox": patch
---

Wrote `SignatureErc8010.suffixParameters` out as JSON ABI parameters instead of parsing a human-readable signature at import, so importing anything from `ox/erc8010` no longer runs or bundles the ABI parser.
