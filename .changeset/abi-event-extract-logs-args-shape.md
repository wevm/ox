---
"ox": patch
---

Fixed `AbiEvent.extractLogs` to return keyed `args` for events with both named and unnamed inputs, matching `AbiEvent.decode`, and fixed `AbiEvent.assertArgs` and the `args` filter to reject positional arguments compared against keyed arguments.
