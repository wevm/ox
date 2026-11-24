/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as Hex from '../../core/Hex.js'
import * as FrameNonce from '../../core/internal/frameNonce.js'
import * as Quantity from '../../core/internal/quantity.js'
import { quantityHex, uintBigint, uintNumber } from './Integer.js'
import * as z from 'zod/mini'

export const chainId = z.codec(
  quantityHex(),
  z.union([/* @__PURE__ */ uintNumber(), /* @__PURE__ */ uintBigint()]),
  {
    decode(value) {
      const id = /* @__PURE__ */ Hex.toBigInt(value)
      return id <= /* @__PURE__ */ BigInt(Number.MAX_SAFE_INTEGER)
        ? /* @__PURE__ */ Number(id)
        : id
    },
    encode: (value) => Hex.fromNumber(value),
  },
)

export const chainIdToRpc = z.codec(
  quantityHex(),
  z.union([
    /* @__PURE__ */ quantityHex(),
    /* @__PURE__ */ uintNumber(),
    /* @__PURE__ */ uintBigint(),
  ]),
  {
    decode: (value) => z.decode(chainId, value),
    encode: (value) => Quantity.fromNumberish(value),
  },
)

export const nonceKeysRpc = /* @__PURE__ */ z
  .readonly(z.array(quantityHex(256)))
  .check(
    z.refine((keys) => {
      try {
        FrameNonce.fromRpc(keys)
        return true
      } catch {
        return false
      }
    }, 'Invalid nonce keys'),
  )

export const nonceKeys = z.codec(
  nonceKeysRpc,
  z.readonly(z.array(uintBigint(256))),
  {
    decode: (keys) => FrameNonce.fromRpc(keys),
    encode: (keys) => FrameNonce.toRpc(keys),
  },
)

export const nonceKeysToRpc = z.codec(
  nonceKeysRpc,
  z.readonly(
    z.array(
      z.union([
        /* @__PURE__ */ quantityHex(256),
        /* @__PURE__ */ uintBigint(256),
        /* @__PURE__ */ uintNumber(),
      ]),
    ),
  ),
  {
    decode: (keys) => FrameNonce.fromRpc(keys),
    encode: (keys) => FrameNonce.toRpc(keys),
  },
)

export function validNonce(value: {
  nonceKeys?: readonly (Hex.Hex | bigint | number)[] | undefined
  nonce?: Hex.Hex | bigint | number | undefined
}): boolean {
  if (value.nonceKeys === undefined) return true
  try {
    FrameNonce.toRpc(value.nonceKeys, value.nonce)
    return true
  } catch {
    return false
  }
}
