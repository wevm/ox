---
"ox": patch
---

Renamed the Tempo configurable account hash domains from `tempo:multisig:*` to `tempo:configurable-account:*` to match Tempo main (tempoxyz/tempo#8502), which changes every `AccountConfig.getAddress`, `AccountConfig.getCommitment`, and `AccountConfig.getSignPayload` result.
