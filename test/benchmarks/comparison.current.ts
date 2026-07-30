import {
  AbiEvent,
  AbiFunction,
  ContractAddress,
  Keystore,
  Mnemonic,
  PersonalMessage,
  Rlp,
  Secp256k1,
  TransactionEnvelope,
  TypedData,
} from 'ox'
import {
  create2Options,
  event,
  eventArgs,
  getAmountIn,
  getAmountOut,
  keystore,
  keystoreKeyOptions,
  mnemonic,
  personalMessage,
  rlpValue,
  seaportAbi,
  seaportArgs,
  sushiReserve0,
  sushiReserve1,
  transactionEnvelope,
  typedData,
  type Operations,
  uniswapAmountIn,
  uniswapReserve0,
  uniswapReserve1,
  uniswapSwapAbi,
  uniswapSwapJson,
  uniswapSwapTo,
} from './comparison.js'

export function createOperations(): Operations {
  const fulfillOrder = AbiFunction.fromAbi(seaportAbi, 'fulfillOrder')
  const messageEvent = AbiEvent.from(event)
  const [keystoreKey] = Keystore.pbkdf2(keystoreKeyOptions)
  const swap = AbiFunction.from(uniswapSwapAbi)
  const rlp = Rlp.fromBytes(rlpValue)

  return {
    abiEventEncode: () => AbiEvent.encode(messageEvent, eventArgs),
    abiFunctionEncodeDataCached: () =>
      AbiFunction.encodeData(fulfillOrder, seaportArgs),
    abiFunctionEncodeDataDynamic: () =>
      AbiFunction.encodeData(seaportAbi, 'fulfillOrder', seaportArgs),
    abiFunctionEncodeDataUniswapCached: () =>
      AbiFunction.encodeData(swap, [1n, 0n, uniswapSwapTo, '0x']),
    abiFunctionEncodeDataUniswapDynamic: () =>
      AbiFunction.encodeData(AbiFunction.from(JSON.parse(uniswapSwapJson)), [
        100_000_000_000_000_000n,
        0n,
        uniswapSwapTo,
        '0x',
      ]),
    contractAddressFromCreate2: () =>
      ContractAddress.fromCreate2(create2Options),
    keystoreDecrypt: () => Keystore.decrypt(keystore, keystoreKey),
    mnemonicToPrivateKey: () => Mnemonic.toPrivateKey(mnemonic, { as: 'Hex' }),
    personalMessageGetSignPayload: () =>
      PersonalMessage.getSignPayload(personalMessage),
    rlpDecode: () => Rlp.toBytes(rlp),
    rlpEncode: () => Rlp.fromBytes(rlpValue),
    secp256k1RandomPrivateKey: () => Secp256k1.randomPrivateKey(),
    transactionEnvelopeGetSignPayload: () =>
      TransactionEnvelope.getSignPayload(transactionEnvelope),
    typedDataGetSignPayload: () => TypedData.getSignPayload(typedData),
    u256GetAmountIn: () =>
      getAmountIn(
        uniswapReserve0,
        uniswapReserve1,
        false,
        sushiReserve0,
        sushiReserve1,
      ),
    u256GetAmountOut: () =>
      getAmountOut(uniswapReserve0, uniswapReserve1, uniswapAmountIn),
  }
}
