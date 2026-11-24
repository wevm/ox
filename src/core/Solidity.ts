export const arrayRegex = /^(.*)\[([0-9]*)\]$/

// `bytes<M>`: binary type of `M` bytes, `0 < M <= 32`
// https://regexr.com/6va55
export const bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/

// `(u)int<M>`: (un)signed integer type of `M` bits, `0 < M <= 256`, `M % 8 == 0`
// https://regexr.com/6v8hp
export const integerRegex =
  /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/

// Literals rather than `2n ** 8n - 1n`: bundlers keep bigint arithmetic at the top level of a
// module, because it can throw, so every bundle that imports this module kept all 96 values.
export const maxInt8 = 0x7fn
export const maxInt16 = 0x7fffn
export const maxInt24 = 0x7fffffn
export const maxInt32 = 0x7fffffffn
export const maxInt40 = 0x7fffffffffn
export const maxInt48 = 0x7fffffffffffn
export const maxInt56 = 0x7fffffffffffffn
export const maxInt64 = 0x7fffffffffffffffn
export const maxInt72 = 0x7fffffffffffffffffn
export const maxInt80 = 0x7fffffffffffffffffffn
export const maxInt88 = 0x7fffffffffffffffffffffn
export const maxInt96 = 0x7fffffffffffffffffffffffn
export const maxInt104 = 0x7fffffffffffffffffffffffffn
export const maxInt112 = 0x7fffffffffffffffffffffffffffn
export const maxInt120 = 0x7fffffffffffffffffffffffffffffn
export const maxInt128 = 0x7fffffffffffffffffffffffffffffffn
export const maxInt136 = 0x7fffffffffffffffffffffffffffffffffn
export const maxInt144 = 0x7fffffffffffffffffffffffffffffffffffn
export const maxInt152 = 0x7fffffffffffffffffffffffffffffffffffffn
export const maxInt160 = 0x7fffffffffffffffffffffffffffffffffffffffn
export const maxInt168 = 0x7fffffffffffffffffffffffffffffffffffffffffn
export const maxInt176 = 0x7fffffffffffffffffffffffffffffffffffffffffffn
export const maxInt184 = 0x7fffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt192 = 0x7fffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt200 = 0x7fffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt208 = 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt216 =
  0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt224 =
  0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt232 =
  0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt240 =
  0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt248 =
  0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxInt256 =
  0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn

export const minInt8 = -0x80n
export const minInt16 = -0x8000n
export const minInt24 = -0x800000n
export const minInt32 = -0x80000000n
export const minInt40 = -0x8000000000n
export const minInt48 = -0x800000000000n
export const minInt56 = -0x80000000000000n
export const minInt64 = -0x8000000000000000n
export const minInt72 = -0x800000000000000000n
export const minInt80 = -0x80000000000000000000n
export const minInt88 = -0x8000000000000000000000n
export const minInt96 = -0x800000000000000000000000n
export const minInt104 = -0x80000000000000000000000000n
export const minInt112 = -0x8000000000000000000000000000n
export const minInt120 = -0x800000000000000000000000000000n
export const minInt128 = -0x80000000000000000000000000000000n
export const minInt136 = -0x8000000000000000000000000000000000n
export const minInt144 = -0x800000000000000000000000000000000000n
export const minInt152 = -0x80000000000000000000000000000000000000n
export const minInt160 = -0x8000000000000000000000000000000000000000n
export const minInt168 = -0x800000000000000000000000000000000000000000n
export const minInt176 = -0x80000000000000000000000000000000000000000000n
export const minInt184 = -0x8000000000000000000000000000000000000000000000n
export const minInt192 = -0x800000000000000000000000000000000000000000000000n
export const minInt200 = -0x80000000000000000000000000000000000000000000000000n
export const minInt208 =
  -0x8000000000000000000000000000000000000000000000000000n
export const minInt216 =
  -0x800000000000000000000000000000000000000000000000000000n
export const minInt224 =
  -0x80000000000000000000000000000000000000000000000000000000n
export const minInt232 =
  -0x8000000000000000000000000000000000000000000000000000000000n
export const minInt240 =
  -0x800000000000000000000000000000000000000000000000000000000000n
export const minInt248 =
  -0x80000000000000000000000000000000000000000000000000000000000000n
export const minInt256 =
  -0x8000000000000000000000000000000000000000000000000000000000000000n

export const maxUint8 = 0xffn
export const maxUint16 = 0xffffn
export const maxUint24 = 0xffffffn
export const maxUint32 = 0xffffffffn
export const maxUint40 = 0xffffffffffn
export const maxUint48 = 0xffffffffffffn
export const maxUint56 = 0xffffffffffffffn
export const maxUint64 = 0xffffffffffffffffn
export const maxUint72 = 0xffffffffffffffffffn
export const maxUint80 = 0xffffffffffffffffffffn
export const maxUint88 = 0xffffffffffffffffffffffn
export const maxUint96 = 0xffffffffffffffffffffffffn
export const maxUint104 = 0xffffffffffffffffffffffffffn
export const maxUint112 = 0xffffffffffffffffffffffffffffn
export const maxUint120 = 0xffffffffffffffffffffffffffffffn
export const maxUint128 = 0xffffffffffffffffffffffffffffffffn
export const maxUint136 = 0xffffffffffffffffffffffffffffffffffn
export const maxUint144 = 0xffffffffffffffffffffffffffffffffffffn
export const maxUint152 = 0xffffffffffffffffffffffffffffffffffffffn
export const maxUint160 = 0xffffffffffffffffffffffffffffffffffffffffn
export const maxUint168 = 0xffffffffffffffffffffffffffffffffffffffffffn
export const maxUint176 = 0xffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint184 = 0xffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint192 = 0xffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint200 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint208 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint216 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint224 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint232 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint240 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint248 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
export const maxUint256 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
