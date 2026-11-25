---
"ox": minor
---

Improved `AbiEvent.extractLogs` type-checking performance: with several event names the event type is selected by name without computing the overload arguments of every event, and without an event name it is the ABI's events, which also types an overloaded event's arguments as the union of its overloads instead of `unknown` (5 to 10× fewer instantiations per call).
