---
"ox": major
---

Renamed the decoded frame destination from `target` to `to`.

```diff
- Frame.from({ target: recipient })
+ Frame.from({ to: recipient })
```
