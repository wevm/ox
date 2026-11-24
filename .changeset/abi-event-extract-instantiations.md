---
"ox": patch
---

Improved `AbiEvent.extractLogs` type-checking performance: with several event names, or none, the event type is selected by name without computing the overload arguments of every event (5 to 6× fewer instantiations per call).
