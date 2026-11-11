---
"ox": patch
---

Fixed `Registration.verify` in `ox/webauthn` to derive `deviceType` from the backup eligibility (BE) flag and to always return `backedUp` from the backup state (BS) flag.
