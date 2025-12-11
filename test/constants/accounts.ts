import { Address, type Hex, Mnemonic, Secp256k1 } from 'ox'

export const accounts = new Array(20).fill(0).map((_, i) => {
  const privateKey = Mnemonic.toPrivateKey(
    'test test test test test test test test test test test junk',
    { path: Mnemonic.path({ index: i }) },
  )
  return {
    address: Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey })),
    privateKey,
  }
}) as unknown as FixedArray<
  {
    address: Address.Address
    privateKey: Hex.Hex
  },
  20
>

type FixedArray<
  type,
  count extends number,
  result extends readonly type[] = [],
> = result['length'] extends count
  ? result
  : FixedArray<type, count, readonly [...result, type]>
