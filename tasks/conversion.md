# ox ↔ viem Conversion Utilities

> Goal: Add `fromViem` / `toViem` utilities to ox (core + tempo) so viem can stop hand-rolling field-by-field conversions in `Formatters.ts` and `Transaction.ts`.

---

## 1. Type Shape Audit

### 1.1 `Transaction` (mined/fetched)

| Property | **ox** | **viem** | Delta |
|---|---|---|---|
| `nonce` | `bigint` | `number` | ⚠️ type mismatch |
| `r` | `bigint` | `Hex` (`0x${string}`) | ⚠️ type mismatch |
| `s` | `bigint` | `Hex` | ⚠️ type mismatch |
| `v` | `number?` | `bigint` | ⚠️ type mismatch |
| `yParity` | `number` | `number` | ✅ |
| `data` | `Hex?` (alias of `input`) | ❌ absent | ox extra alias |
| `typeHex` | ❌ absent | `Hex \| null` | viem extra field |
| `gasPrice` (eip1559) | `bigint?` (optional) | `undefined` (discriminant) | structural |
| `chainId` | `number` | `number` | ✅ |
| `blockNumber` | `bigint` | `bigint` | ✅ |
| `gas` | `bigint` | `bigint` | ✅ |
| `value` | `bigint` | `bigint` | ✅ |
| `transactionIndex` | `number` | `number` | ✅ |

### 1.2 `TransactionRequest`

| Property | **ox** | **viem** | Delta |
|---|---|---|---|
| `nonce` | `bigint?` | `number?` | ⚠️ |
| `input` | `Hex?` (alias of `data`) | ❌ absent | ox extra alias |
| `chainId` | `number?` | ❌ absent on base | ox has it on base |
| `authorizationList` | ox `Authorization.ListSigned` (r/s = `bigint`) | viem `AuthorizationList` (r/s = `Hex?`) | ⚠️ nested sig format |
| `blobVersionedHashes` | `readonly Hex[]?` | conditional `OneOf` (eip4844) | structural |
| `blobs` | `readonly Hex[]?` | `readonly Hex[] \| ByteArray[]?` | viem also allows `ByteArray` |
| `kzg` | ❌ absent | present on eip4844 | viem-only |
| `sidecars` | ❌ absent | present on eip4844 | viem-only (ox has on `TxEnvelopeEip4844`) |

### 1.3 `TxEnvelope*` ↔ viem `TransactionSerializable*`

| Property | **ox `TxEnvelope.Base`** | **viem `TransactionSerializableBase`** | Delta |
|---|---|---|---|
| `nonce` | `bigint?` | `number?` | ⚠️ |
| `gas` | `bigint?` | `bigint?` | ✅ |
| `r` / `s` | `bigint?` (on envelope) | ❌ absent (separate `Signature` arg) | ⚠️ structural |
| `yParity` / `v` | on envelope | ❌ absent (in `Signature`) | ⚠️ structural |
| `from` | `Address?` | ❌ absent | ox-only |
| `input` | `Hex?` (alias) | ❌ absent | ox-only |

### 1.4 `Block`

| Property | **ox** | **viem** | Delta |
|---|---|---|---|
| `baseFeePerGas` | `bigint?` (optional) | `bigint \| null` (required) | ⚠️ optionality |
| `blobGasUsed` | `bigint?` (optional) | `bigint` (required) | ⚠️ optionality |
| `difficulty` | `bigint?` (optional) | `bigint` (required) | ⚠️ optionality |
| `excessBlobGas` | `bigint?` (optional) | `bigint` (required) | ⚠️ optionality |
| `totalDifficulty` | `bigint?` (optional) | `bigint \| null` (required) | ⚠️ optionality |
| `sealFields` | `readonly Hex[]?` (optional) | `Hex[]` (required) | ⚠️ optionality |
| `extraData` | `Hex?` (optional) | `Hex` (required) | ⚠️ optionality |
| `transactions` (inner) | ox `Transaction` (nonce=bigint, r/s=bigint) | viem `Transaction` (nonce=number, r/s=Hex) | ⚠️ recursive |

### 1.5 Tempo `Transaction`

Inherits all core `Transaction` deltas, plus:

| Property | **ox/tempo** | **viem/tempo** | Delta |
|---|---|---|---|
| `feePayerSignature.r/s` | `bigint` | `Hex` | ⚠️ |
| `feePayerSignature.v` | `number?` | `bigint` | ⚠️ |
| `signature` | `SignatureEnvelope` (ox) | `SignatureEnvelope` (same) | ✅ |
| `nonce` | `bigint` | `number` | ⚠️ |

### 1.6 Tempo `TransactionRequest`

Inherits core `TransactionRequest` deltas. Tempo-specific fields (`calls`, `feeToken`, `nonceKey`, `validBefore`, `validAfter`, `keyAuthorization`) are identical in both.

---

## 2. Conversion Map

These are the **only** field-level conversions needed, consistent across all types:

| Field(s) | `fromViem` (viem → ox) | `toViem` (ox → viem) |
|---|---|---|
| `nonce` | `BigInt(nonce)` | `Number(nonce)` |
| `r`, `s` (signature) | `BigInt(r)` | `Hex.fromNumber(r, { size: 32 })` |
| `v` | `Number(v)` | `BigInt(v)` |
| `typeHex` | strip it | synthesize via `toRpcType[type]` |
| `data` / `input` | alias both | strip `data` alias |
| `feePayerSignature.r/s` (tempo) | `BigInt(r)` | `Hex.fromNumber(r, { size: 32 })` |
| Block optional→required fields | passthrough (`undefined` ok) | `undefined` → `0n` / `null` where viem requires |
| `authorizationList[].r/s` | `BigInt(r)` | `Hex.fromNumber(r, { size: 32 })` |
| `authorizationList[].v` | `Number(v)` | `BigInt(v)` |

---

## 3. Types

### 3.1 `FromViem` — viem shape (input to `fromViem`)

```ts
// src/core/Transaction.ts
export namespace FromViem {
  /** viem's Transaction shape. */
  export type Transaction<pending extends boolean = false> = Compute<
    Omit<
      Transaction_ox.Base<string, pending, bigint, number>,
      'nonce' | 'r' | 's' | 'v' | 'data'
    > & {
      nonce: number
      r: Hex.Hex
      s: Hex.Hex
      v: bigint
      typeHex: Hex.Hex | null
      // Per-type extras carried through generically:
      accessList?: AccessList.AccessList | undefined
      authorizationList?: FromViem.AuthorizationList | undefined
      blobVersionedHashes?: readonly Hex.Hex[] | undefined
      gasPrice?: bigint | undefined
      maxFeePerGas?: bigint | undefined
      maxFeePerBlobGas?: bigint | undefined
      maxPriorityFeePerGas?: bigint | undefined
    }
  >

  /** viem's AuthorizationList (sig fields as Hex). */
  export type AuthorizationList = readonly {
    address: Address.Address
    chainId: number
    nonce: number
    r: Hex.Hex
    s: Hex.Hex
    v: number
    yParity: number
  }[]
}
```

```ts
// src/core/TransactionRequest.ts
export namespace FromViem {
  /** viem's TransactionRequest shape. */
  export type TransactionRequest = Compute<
    Omit<
      TransactionRequest_ox<bigint, number, string>,
      'nonce' | 'authorizationList' | 'input'
    > & {
      nonce?: number | undefined
      authorizationList?: FromViem.AuthorizationList | undefined
    }
  >

  export type AuthorizationList = readonly {
    address: Address.Address
    chainId: number
    nonce: number
    r?: Hex.Hex | undefined
    s?: Hex.Hex | undefined
    v?: number | undefined
    yParity?: number | undefined
  }[]
}
```

```ts
// src/core/Block.ts
export namespace FromViem {
  /** viem's Block shape. */
  export type Block<
    includeTransactions extends boolean = false,
    blockTag extends Tag = 'latest',
  > = Compute<
    Omit<
      Block_ox<includeTransactions, blockTag>,
      | 'baseFeePerGas' | 'blobGasUsed' | 'difficulty'
      | 'excessBlobGas' | 'totalDifficulty'
      | 'extraData' | 'sealFields' | 'transactions'
    > & {
      baseFeePerGas: bigint | null
      blobGasUsed: bigint
      difficulty: bigint
      excessBlobGas: bigint
      extraData: Hex.Hex
      sealFields: Hex.Hex[]
      totalDifficulty: bigint | null
      transactions: includeTransactions extends true
        ? readonly FromViem.Transaction<blockTag extends 'pending' ? true : false>[]
        : readonly Hex.Hex[]
    }
  >
}
```

### 3.2 `ToViem` — viem shape (output of `toViem`)

```ts
// src/core/Transaction.ts
export namespace ToViem {
  /** Ox Transaction converted to viem shape. */
  export type Transaction<pending extends boolean = false> = Compute<
    Omit<
      Transaction_ox.Base<string, pending, bigint, number>,
      'nonce' | 'r' | 's' | 'v' | 'data'
    > & {
      nonce: number
      r: Hex.Hex
      s: Hex.Hex
      v: bigint
      typeHex: Hex.Hex | null
      accessList?: AccessList.AccessList | undefined
      authorizationList?: ToViem.AuthorizationList | undefined
      blobVersionedHashes?: readonly Hex.Hex[] | undefined
      gasPrice?: bigint | undefined
      maxFeePerGas?: bigint | undefined
      maxFeePerBlobGas?: bigint | undefined
      maxPriorityFeePerGas?: bigint | undefined
    }
  >

  export type AuthorizationList = readonly {
    address: Address.Address
    chainId: number
    nonce: number
    r: Hex.Hex
    s: Hex.Hex
    v: number
    yParity: number
  }[]
}
```

```ts
// src/core/Block.ts
export namespace ToViem {
  /** Ox Block converted to viem shape. */
  export type Block<
    includeTransactions extends boolean = false,
    blockTag extends Tag = 'latest',
  > = Compute<
    Omit<Block_ox<includeTransactions, blockTag>,
      | 'baseFeePerGas' | 'blobGasUsed' | 'difficulty'
      | 'excessBlobGas' | 'totalDifficulty'
      | 'extraData' | 'sealFields' | 'transactions'
    > & {
      baseFeePerGas: bigint | null
      blobGasUsed: bigint
      difficulty: bigint
      excessBlobGas: bigint
      extraData: Hex.Hex
      sealFields: Hex.Hex[]
      totalDifficulty: bigint | null
      transactions: includeTransactions extends true
        ? readonly ToViem.Transaction<blockTag extends 'pending' ? true : false>[]
        : readonly Hex.Hex[]
    }
  >
}
```

---

## 4. Functions to Implement

### 4.1 Core (`src/core/`)

| File | Function | Description |
|---|---|---|
| `Transaction.ts` | `fromViem(tx: FromViem.Transaction): Transaction` | Convert viem Transaction → ox Transaction |
| `Transaction.ts` | `toViem(tx: Transaction): ToViem.Transaction` | Convert ox Transaction → viem Transaction |
| `TransactionRequest.ts` | `fromViem(req: FromViem.TransactionRequest): TransactionRequest` | Convert viem TransactionRequest → ox TransactionRequest |
| `TransactionRequest.ts` | `toViem(req: TransactionRequest): ToViem.TransactionRequest` | Convert ox TransactionRequest → viem TransactionRequest |
| `Block.ts` | `fromViem(block: FromViem.Block): Block` | Convert viem Block → ox Block |
| `Block.ts` | `toViem(block: Block): ToViem.Block` | Convert ox Block → viem Block |

### 4.2 Tempo (`src/tempo/`)

| File | Function | Description |
|---|---|---|
| `Transaction.ts` | `fromViem(tx): Transaction` | Extends core `fromViem` + converts `feePayerSignature.r/s` from Hex → bigint |
| `Transaction.ts` | `toViem(tx): ToViem.Transaction` | Extends core `toViem` + converts `feePayerSignature.r/s` from bigint → Hex |
| `TransactionRequest.ts` | `fromViem(req): TransactionRequest` | Extends core `fromViem` (tempo-specific fields pass through as-is) |
| `TransactionRequest.ts` | `toViem(req): ToViem.TransactionRequest` | Extends core `toViem` |

---

## 5. Nasties This Eliminates in viem

Once ox ships these utilities, viem can replace:

| viem File | Code Replaced |
|---|---|
| `src/tempo/Formatters.ts` → `formatTransaction` | Manual `Hex.fromNumber(r)`, `Number(nonce)`, `BigInt(v)` → `Transaction.toViem(ox_Transaction.fromRpc(rpc))` |
| `src/tempo/Formatters.ts` → `formatTransactionRequest` | Manual field mapping + `as never` → `TransactionRequest.toViem(...)` |
| `src/tempo/Transaction.ts` → `deserializeTempo` | Manual `Hex.fromNumber(r)`, `Number(nonce)` → `Transaction.toViem(TxTempo.deserialize(...))` |
| `src/tempo/Transaction.ts` → `serializeTempo` | Manual `BigInt(r)`, `BigInt(nonce)` → `Transaction.fromViem(viemTx)` then `TxTempo.serialize(...)` |
| `src/tempo/Transaction.ts` types | `TransactionTempo`, `TransactionRpc`, `TransactionSerializableTempo` can derive from ox types + `FromViem`/`ToViem` |
