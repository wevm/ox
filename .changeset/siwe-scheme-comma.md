---
"ox": patch
---

Fixed `Siwe.createMessage` and `Siwe.parseMessage` accepting a comma in `scheme`. The class `[a-zA-Z0-9+-.]` read `+-.` as a range that includes `,`.
