---
"ox": patch
---

`ox/tempo`: Derived configurable account addresses from the initial config hash instead of a recovery factory (tempoxyz/tempo#8595), so `AccountConfig.getAddress` no longer takes a `factory` option.
