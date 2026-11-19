---
"ox": patch
---

Fixed `Siwe.isUri` to validate the authority of URIs that have a path, so `Siwe.createMessage` rejects a `uri` or resource such as `uri://[::300.0.0.0]/p` the same way it already rejected `uri://[::300.0.0.0]`.
