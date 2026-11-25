---
"ox": minor
---

**Breaking:** `Value.from` (and `fromEther`, `fromGwei`) now throws `Value.InvalidDecimalNumberError` for input without digits (`""`, `"."`, `"-"`, `"-."`), which returned `0n` or threw a `SyntaxError` before, and `Value.InvalidDecimalsError` for negative or non-integer `decimals`. A negative value without integer digits, such as `"-.0"`, now parses instead of throwing a `SyntaxError`.
