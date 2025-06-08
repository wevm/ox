---
"ox": minor
---

**Breaking(`Keystore`):** Keystore derivation functions (e.g. `Keystore.pbkdf2`) now return a tuple of the key and derivation options,
instead of an object with the key and options.

```diff
import { Keystore } from 'ox'

- const key = Keystore.pbkdf2({ password: 'testpassword' })
+ const [key, opts] = Keystore.pbkdf2({ password: 'testpassword' })
```
