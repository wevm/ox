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

## Functions

| Function                                      | Description                                                   |
| --------------------------------------------- | ------------------------------------------------------------- |
| [`Value.from`](/api/value/from)               | Parses a string representation of a Value to `bigint`.        |
| [`Value.fromEther`](/api/value/fromEther)     | Parses a string representation of Ether to a `bigint` Value.  |
| [`Value.fromGwei`](/api/value/fromGwei)       | Parses a string representation of Gwei to a `bigint` Value.   |
| [`Value.format`](/api/value/format)           | Formats a `bigint` Value to its string representation.        |
| [`Value.formatEther`](/api/value/formatEther) | Formats a `bigint` Value to a string representation of Ether. |
| [`Value.formatGwei`](/api/value/formatGwei)   | Formats a `bigint` Value to a string representation of Gwei.  |