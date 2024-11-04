# Mnemonics

A [BIP-39 mnemonic phrase](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) is a list of words that is a representation of a seed, which can be used to derive the keys of a [BIP-32 Hierarchical Deterministic (HD) Wallet](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki).

We can combine a mnemonic phrase (or seed) with an Ethereum-specific derivation path (e.g. `m/44'/60'/0/0/0`) to derive a private key and its associated Ethereum address.

## Examples

### Generating a Random Mnemonic

We can generate a random mnemonic phrase using [`Mnemonic.random`](/api/mnemonic#random).

```ts twoslash
import { Mnemonic } from 'ox'

const mnemonic = Mnemonic.random(Mnemonic.english)
```

Ox supports the following languages:

| Language            | Export                        |
| ------------------- | ----------------------------- |
| English             | `Mnemonic.english`            |
| Czech               | `Mnemonic.czech`              |
| French              | `Mnemonic.french`             |
| Italian             | `Mnemonic.italian`            |
| Japanese            | `Mnemonic.japanese`           |
| Korean              | `Mnemonic.korean`             |
| Portuguese          | `Mnemonic.portuguese`         |
| Simplified Chinese  | `Mnemonic.simplifiedChinese`  |
| Spanish             | `Mnemonic.spanish`            |
| Traditional Chinese | `Mnemonic.traditionalChinese` |

### Deriving a Private Key

Here is an example of deriving a private key from a mnemonic phrase using [`Mnemonic.toPrivateKey`](/api/mnemonic#toprivatekey). This will use the default path of `m/44'/60'/0/0/0`.

```ts twoslash
import { Mnemonic } from 'ox'

const mnemonic = Mnemonic.random(Mnemonic.english)
const privateKey = Mnemonic.toPrivateKey(mnemonic)
```

We can also specify a custom path using the [`Mnemonic.path`](/api/mnemonic#path) function.

```ts twoslash
import { Mnemonic } from 'ox'

const mnemonic = Mnemonic.random(Mnemonic.english)

const path = Mnemonic.path({ account: 1, index: 2 }) // `m/44'/60'/1/0/2` // [!code focus]
const privateKey = Mnemonic.toPrivateKey(mnemonic, { path }) // [!code focus]

// or, we can pass the path as a string // [!code focus]
const privateKey_2 = Mnemonic.toPrivateKey(mnemonic, { path: 'm/44/60/1/0/2' }) // [!code focus]
```

### Deriving Public Keys & Addresses

Mnemonic private keys are derived from the secp256k1 curve. This means we can derive a public key using [`Secp256k1.getPublicKey`](/api/secp256k1#getpublickey), and an Ethereum address from a public key using [`Address.fromPublicKey`](/api/address#frompublickey).

```ts twoslash
import { Address, Mnemonic, Secp256k1 } from 'ox'

const mnemonic = Mnemonic.random(Mnemonic.english)
const privateKey = Mnemonic.toPrivateKey(mnemonic)

const publicKey = Secp256k1.getPublicKey({ privateKey }) // [!code focus]
const address = Address.fromPublicKey(publicKey) // [!code focus]
```