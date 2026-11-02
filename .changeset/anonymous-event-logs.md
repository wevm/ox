---
"ox": patch
---

Fixed `AbiEvent.decodeLog` and `AbiEvent.extractLogs` to decode anonymous event logs when every event in the ABI is anonymous or, for `extractLogs`, when `eventName` names the event, throwing `AbiEvent.AnonymousEventAmbiguityError` from `decodeLog` when several anonymous events fit.
