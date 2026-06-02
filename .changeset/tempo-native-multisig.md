---
'ox': minor
---

Added support for TIP-1061 native multisig accounts. A new `tempo/MultisigConfig` module derives stable multisig account addresses and permanent config IDs from a weighted owner configuration and computes the owner approval digest that owners sign. `tempo/SignatureEnvelope` gains a `multisig` signature variant (type `0x05`) that aggregates primitive owner approvals and carries the optional bootstrap config (`init`) on the first transaction from a derived account.
