# Error Handling 

Every function namespace in Ox exports an accompanying error type (`ErrorType`) and parser (`parseError`) that you can use to strongly type your `catch` statements, or inject into a custom type-safe error handling library (e.g. [`neverthrow`](https://github.com/supermacro/neverthrow), [`Effect`](https://effect.website/), etc.).

## Usage with Vanilla TypeScript

Unfortunately, [TypeScript doesn't have an abstraction for typed exceptions](https://github.com/microsoft/TypeScript/issues/13219), so the most pragmatic & vanilla approach would be to explicitly cast error types in the `catch` statement with the function's `.ErrorType` property.

```ts twoslash
import { AbiParameters, Errors, Hex } from 'ox'

try {
  AbiParameters.encode(
    AbiParameters.from('address'), 
    ['0xc961145a54c96e3ae9baa048c4f4d6b04c13916b']
  )
} catch (err) {
  const error = err as AbiParameters.encode.ErrorType
  error.name
  //    ^? 










  if (error.name === 'Address.InvalidAddressError') 
    error.cause.name
    //          ^? 
}






```

## Usage with `neverthrow`

You can utilize Ox's `.ErrorType` property into custom type-safe error handling libraries like [`neverthrow`](https://github.com/supermacro/neverthrow).

```ts twoslash
// @noErrors
import { AbiParameters } from 'ox'
import { fromThrowable } from 'neverthrow';

const encode = fromThrowable( // [!code hl]
  AbiParameters.encode, // [!code hl]
  e => e as AbiParameters.encode.ErrorType // [!code hl]
) // [!code hl]

const result = encode(AbiParameters.from('bytes'), ['0xdeadbeef'])

if (result.isErr()) // [!code hl]
	result.error.name // [!code hl]
  //           ^?







```

