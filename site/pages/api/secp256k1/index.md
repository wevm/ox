# Secp256k1

The **Secp256k1** Module provides a set of utility functions for secp256k1 cryptography.

## Functions

| Module                                                          | Description                                                            |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`Secp256k1.getPublicKey`](/api/secp256k1/getPublicKey)         | Computes the ECDSA public key from a provided private key.             |
| [`Secp256k1.randomPrivateKey`](/api/secp256k1/randomPrivateKey) | Generates a random ECDSA private key on the secp256k1 curve.           |
| [`Secp256k1.recoverAddress`](/api/secp256k1/recoverAddress)     | Recovers the signing address from the signed payload and signature.    |
| [`Secp256k1.recoverPublicKey`](/api/secp256k1/recoverPublicKey) | Recovers the signing public key from the signed payload and signature. |
| [`Secp256k1.sign`](/api/secp256k1/sign)                         | Signs a payload with the provided private key.                         |
| [`Secp256k1.verify`](/api/secp256k1/verify)                     | Verifies a payload was signed by the provided address.                 |

