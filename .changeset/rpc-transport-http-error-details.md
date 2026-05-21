---
'ox': patch
---

Fixed `RpcTransport.HttpError.details` to render raw-text error bodies verbatim instead of JSON-stringifying them with surrounding quotes.
