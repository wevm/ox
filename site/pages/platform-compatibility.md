# Platform Compatibility [Platforms compatible with Ox]

**Ox supports all modern browsers (Chrome, Edge, Firefox, etc) & runtime environments (Node 18+, Deno, Bun, etc).**

Ox uses modern EcmaScript features such as:

- [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- Error [`cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- TextEncoder [`encode`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode)

You can check support for these features on [Can I use...](https://caniuse.com/)

## Polyfills

If your platform does not support one of the required features, it is also possible to import a polyfill.

### Error `cause`

- [core-js](https://github.com/zloirock/core-js)

### `TextEncoder`
- [FastestSmallestTextEncoderDecoder](https://github.com/anonyco/FastestSmallestTextEncoderDecoder)
