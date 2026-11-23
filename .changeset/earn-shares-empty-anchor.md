---
"ox": patch
---

Made `EarnShares.toAmount`, `EarnShares.toAmountUp` and `EarnShares.toVenueAmount` throw `EarnShares.InvalidAnchorError` for an anchor with a zero side, such as an empty vault's `engineShares` and `shareSupply`, instead of a `RangeError` from dividing by zero.
