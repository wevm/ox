# Imports & Bundle Size

## Imports

There are two approaches to import Modules in Ox:

- [Named Imports](#named-imports): Importing modules via the root `ox` namespace.
- [Entrypoint Imports](#entrypoint-imports): Importing modules via an `ox/{Module}` namespace.

### Named Imports

Modules can be imported via their respective module export in the root `ox` namespace:

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.encode([Hex.from('hello'), Hex.from('world')])
```

This approach does not compromise on [tree-shakability](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking), as most modern bundlers support Deep Scope Analysis. As a result, this will not impact the bundle size of your application.

Bundlers known to support Deep Scope Analysis include: [Vite](https://vitejs.dev/), [Rollup](https://rollupjs.org/), [Webpack 5+](https://webpack.js.org/), [esbuild](https://esbuild.github.io/), [swc](https://swc.rs/), and more.

### Entrypoint Imports

If your bundler does not support Deep Scope Analysis, you are also able to import modules via their respective entrypoint:

```ts twoslash
import * as Hex from 'ox/Hex'
import * as Rlp from 'ox/Rlp'

const rlp = Rlp.encode([Hex.from('hello'), Hex.from('world')])
```

Alternatively, you can explicitly import the functions:

```ts twoslash
import { toHex } from 'ox/Hex'
import { toRlp } from 'ox/Rlp'

const rlp = toRlp([toHex('hello'), toHex('world')])
```

:::note
Ox exports aliases for explicit function imports (ie. `Hex.from` → `toHex`), this is to ensure no naming conflicts arise when importing multiple functions from different modules, and to enhance readability.
:::

## Tree Shakability & Bundle Size

Each Module in Ox exports a number of functions (e.g. `Hex` exports `from`, `concat`, `padLeft`, etc). It is important to note that Modules **are not stateful instances with methods** (ie. you cannot instantiate a `Hex` class/object), they are merely a collection of pure stateless functions. This is because function exports are [tree-shakable](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking), whereas instance methods are not.

When Modules are imported in Ox, only the functions that you use from that Module will be included in the final bundle of your application. Unused functions are automatically removed, resulting in a lower bundle size.

Whereas, methods that are attached to instances cannot be tree-shaken by bundlers, which will lead to all methods of a given instance being included in the bundle, regardless of whether they are used or not.