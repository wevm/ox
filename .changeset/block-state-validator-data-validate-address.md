---
'ox': patch
---

Made `ValidatorData.encode` call `Address.assert` on the validator argument so malformed validator addresses are rejected instead of producing invalid ERC-191 payloads.
