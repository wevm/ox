---
"ox": patch
---

Fixed `AbiEvent.decode`, `AbiEvent.decodeLog` and `AbiEvent.extractLogs` to reject indexed value topics longer than 32 bytes (`Hex.SizeOverflowError`), `address` topics with non-hex characters when decoded with `checksumAddress: false` (`Address.InvalidAddressError`, as with checksumming), and `bytesN` topics with non-hex characters (`Hex.InvalidHexValueError`).
