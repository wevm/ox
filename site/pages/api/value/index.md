# Value

The **Value** Module provides a set of utility functions for displaying and parsing Ethereum Values as defined under **2.1. Value** in the [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf).

```ts twoslash
// @noErrors
import { Value } from 'ox'

const value = Value.fromEther('1')
// 1_000_000_000_000_000_000n

const formattedValue = Value.formatEther(value)
// '1'

const value = Value.fromEther('1', 'szabo')
// 1_000_000n
```
