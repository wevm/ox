---
"ox": patch
---

Added experimental `ox/tempo` support for attested signers (TIP-1159 to TIP-1163): the `AttestedSigner` module (attested address, sign payload, policy ID, registration binding, key ID, Attested Key Registry ABI and address), the `attested` (`0x06`) `SignatureEnvelope` variant for transactions, key authorizations, and configurable account owner approvals, and `TxEnvelopeTempo.expiringNonceKey` (TIP-1009).
