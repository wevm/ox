---
"ox": patch
---

Fixed `Siwe.createMessage` to throw `InvalidMessageFieldError` when `requestId` contains a line feed or carriage return.
