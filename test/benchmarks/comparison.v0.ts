import {
  AbiEvent,
  AbiFunction,
  ContractAddress,
  Hash,
  Keystore,
  Mnemonic,
  PersonalMessage,
  Rlp,
  Secp256k1,
  TxEnvelopeEip1559,
  TypedData,
} from 'ox-v0'
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
  secp256k1Payload,
  secp256k1PrivateKey,
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
  const secp256k1PublicKey = Secp256k1.getPublicKey({
    privateKey: secp256k1PrivateKey,
  })
  const secp256k1Signature = Secp256k1.sign({
    extraEntropy: false,
    payload: secp256k1Payload,
    privateKey: secp256k1PrivateKey,
  })

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
    hashKeccak256: () => Hash.keccak256(secp256k1Payload),
    keystoreDecrypt: () => Keystore.decrypt(keystore, keystoreKey),
    mnemonicToPrivateKey: () => Mnemonic.toPrivateKey(mnemonic, { as: 'Hex' }),
    personalMessageGetSignPayload: () =>
      PersonalMessage.getSignPayload(personalMessage),
    rlpDecode: () => Rlp.toBytes(rlp),
    rlpEncode: () => Rlp.fromBytes(rlpValue),
    secp256k1RandomPrivateKey: () => Secp256k1.randomPrivateKey(),
    secp256k1RecoverPublicKey: () =>
      Secp256k1.recoverPublicKey({
        payload: secp256k1Payload,
        signature: secp256k1Signature,
      }),
    secp256k1Sign: () =>
      Secp256k1.sign({
        extraEntropy: false,
        payload: secp256k1Payload,
        privateKey: secp256k1PrivateKey,
      }),
    secp256k1Verify: () =>
      Secp256k1.verify({
        payload: secp256k1Payload,
        publicKey: secp256k1PublicKey,
        signature: secp256k1Signature,
      }),
    transactionEnvelopeGetSignPayload: () =>
      TxEnvelopeEip1559.getSignPayload(transactionEnvelope),
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
