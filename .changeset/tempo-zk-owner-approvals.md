---
"ox": patch
---

Accepted TIP-1131 ZK signatures as native multisig owner approvals in `SignatureEnvelope`. `Multisig.signatures` and `sortMultisigApprovals` now take `SignatureEnvelope.MultisigApproval` (a primitive or ZK signature), and `deserialize` admits `0x06` approvals inside `0x05` envelopes.
