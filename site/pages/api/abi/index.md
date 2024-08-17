# Abi

The **Abi** Module provides a set of utility functions for encoding, decoding, and working with [Application Binary Interfaces (ABIs)](https://docs.soliditylang.org/en/latest/abi-spec.html).

```ts twoslash
// @noErrors
import { Abi } from 'ox'

const data = Abi.encode(['uint256', 'boolean', 'string'], [1n, true, 'hello'])
// '0x...'

const arguments = Abi.decode(['uint256', 'boolean', 'string'], data)
// [1n, true, 'hello']

const selector = Abi.getSelector('approve(address,uint256)')
// '0x095ea7b3'
```
