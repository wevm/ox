---
"ox": patch
---

`ox/tempo`: Derived configurable account addresses from the initial config hash to match tempoxyz/tempo#8595: `AccountConfig.getAddress` no longer takes a `factory` option and returns the last 20 bytes of the account preimage hash instead of a CREATE2 address, which changes every derived address.
