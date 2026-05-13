---
"ox": major
---

Flipped `Signature.Signature`, `PublicKey.PublicKey`, `BlsPoint.G1`, `BlsPoint.G2`, and Tempo `SignatureEnvelope` variants to canonical hex strings, removed the polymorphic `Signature.from` / `PublicKey.from` / `BlsPoint.from` constructors, and defaulted the `as` option on crypto signing/recovery surfaces to `'Hex'`. Use `fromHex` / `fromBytes` / `fromParts` and `toParts` codecs to convert between hex and structured parts.

```diff
- type Signature = { r: bigint; s: bigint; yParity: number }
+ type Signature = `0x${string}`

- type PublicKey = { prefix: number; x: bigint; y: bigint }
+ type PublicKey = `0x${string}`

- const sig = Signature.from({ r, s, yParity })
+ const sig = Signature.fromParts({ r, s, yParity })

- const pk = PublicKey.from(hex)
+ const pk = PublicKey.fromHex(hex)

- const { r, s } = Secp256k1.sign({ payload, privateKey })
+ const { r, s } = Signature.toParts(Secp256k1.sign({ payload, privateKey }))
+ // or
+ const { r, s } = Secp256k1.sign({ payload, privateKey, as: 'Object' })
```
