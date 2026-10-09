import { bn254 } from '@noble/curves/bn254'
import { Bytes, Hex } from 'ox'
import { Groth16, Oidc } from 'ox/tempo'
import { describe, expect, test } from 'vitest'
import { oidcDev } from '../../test/tempo/zk.js'

const { message, signature, verifyingKey } = oidcDev

// Writes bytes into a copy of a proof at an offset.
function patch(proof: Hex.Hex, offset: number, bytes: Uint8Array): Hex.Hex {
  const copy = Bytes.fromHex(proof)
  copy.set(bytes, offset)
  return Hex.fromBytes(copy)
}

// A point on the G2 curve outside its prime-order subgroup, in TIP-1131's encoding.
function nonSubgroupG2(): Uint8Array {
  const { Fp2 } = bn254.fields
  const b = bn254.G2.CURVE.b
  for (let i = 1n; ; i++) {
    const x = Fp2.fromBigTuple([i, 1n])
    const rhs = Fp2.add(Fp2.mul(Fp2.sqr(x), x), b)
    let y: typeof x
    try {
      y = Fp2.sqrt(rhs)
    } catch {
      continue
    }
    if (!Fp2.eql(Fp2.sqr(y), rhs)) continue
    const point = bn254.G2.ProjectivePoint.fromAffine({ x, y })
    if (point.isTorsionFree()) continue
    return Bytes.concat(
      ...[x.c1, x.c0, y.c1, y.c0].map((value) =>
        Bytes.fromNumber(value, { size: 32 }),
      ),
    )
  }
}

describe('verify', () => {
  test('default', () => {
    expect(
      Groth16.verify({
        proof: signature.proof,
        publicInput: signature.publicInput,
        verifyingKey,
      }),
    ).toBe(true)
  })

  test('behavior: message form', () => {
    expect(
      Groth16.verify({
        proof: message.proof,
        publicInput: message.publicInput,
        verifyingKey,
      }),
    ).toBe(true)
  })

  test('behavior: public input of the statement', () => {
    const publicInput = Oidc.getPublicInput(signature)
    expect(publicInput).toBe(signature.publicInput)
    expect(
      Groth16.verify({
        proof: Bytes.fromHex(signature.proof),
        publicInput: Hex.toBigInt(publicInput),
        verifyingKey: Bytes.fromHex(verifyingKey),
      }),
    ).toBe(true)
  })

  test('behavior: rejects another public input', () => {
    expect(
      Groth16.verify({
        proof: signature.proof,
        publicInput: Hex.toBigInt(signature.publicInput) + 1n,
        verifyingKey,
      }),
    ).toBe(false)
    // Neither form's proof verifies as the other's.
    expect(
      Groth16.verify({
        proof: signature.proof,
        publicInput: message.publicInput,
        verifyingKey,
      }),
    ).toBe(false)
    expect(
      Groth16.verify({
        proof: message.proof,
        publicInput: signature.publicInput,
        verifyingKey,
      }),
    ).toBe(false)
  })

  test('behavior: rejects a public input outside the field', () => {
    expect(
      Groth16.verify({
        proof: signature.proof,
        publicInput:
          Hex.toBigInt(signature.publicInput) +
          21888242871839275222246405745257275088548364400416034343698204186575808495617n,
        verifyingKey,
      }),
    ).toBe(false)
  })

  test('behavior: rejects malformed proofs', () => {
    const verify = (proof: Hex.Hex) =>
      Groth16.verify({
        proof,
        publicInput: signature.publicInput,
        verifyingKey,
      })
    const { proof } = signature

    // Wrong size.
    expect(verify(Hex.slice(proof, 1))).toBe(false)
    // A coordinate equal to the base field modulus.
    expect(
      verify(patch(proof, 0, Bytes.fromNumber(bn254.fields.Fp.ORDER))),
    ).toBe(false)
    // Points at infinity.
    expect(verify(patch(proof, 0, new Uint8Array(64)))).toBe(false)
    expect(verify(patch(proof, 64, new Uint8Array(128)))).toBe(false)
    expect(verify(patch(proof, 192, new Uint8Array(64)))).toBe(false)
    // Points off the curve.
    const flipped = (offset: number) =>
      patch(proof, offset, Bytes.from([Bytes.fromHex(proof)[offset]! ^ 1]))
    expect(verify(flipped(63))).toBe(false)
    expect(verify(flipped(191))).toBe(false)
    expect(verify(flipped(255))).toBe(false)
    // `B` with its `F_p^2` halves swapped, as in `(c0, c1)` order.
    const bytes = Bytes.fromHex(proof)
    expect(
      verify(
        patch(patch(proof, 64, bytes.slice(96, 128)), 96, bytes.slice(64, 96)),
      ),
    ).toBe(false)
    // `B` on the twist but outside the prime-order subgroup.
    expect(verify(patch(proof, 64, nonSubgroupG2()))).toBe(false)
    // `A` and `C` swapped.
    expect(
      verify(patch(patch(proof, 0, bytes.slice(192)), 192, bytes.slice(0, 64))),
    ).toBe(false)
  })

  test('error: malformed verifying key', () => {
    expect(() =>
      Groth16.verify({
        proof: signature.proof,
        publicInput: signature.publicInput,
        verifyingKey: Hex.slice(verifyingKey, 1),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Groth16.InvalidVerifyingKeyError: The verifying key is invalid: expected 576 bytes, got 575.]`,
    )
    expect(() =>
      Groth16.verify({
        proof: signature.proof,
        publicInput: signature.publicInput,
        verifyingKey: patch(verifyingKey, 64, nonSubgroupG2()),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Groth16.InvalidVerifyingKeyError: The verifying key is invalid: a point is not in its prime-order group.]`,
    )
  })
})
