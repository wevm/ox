---
"ox": minor
---

**Breaking(`Keystore`):** `Keystore.encrypt` function interface has changed to require derivation options (`opts`).

```diff
import { Keystore } from 'ox'

const [key, opts] = Keystore.pbkdf2({ password: 'testpassword' })

- const encrypted = await Keystore.encrypt(secret, key)
+ const encrypted = await Keystore.encrypt(secret, key, opts)
```