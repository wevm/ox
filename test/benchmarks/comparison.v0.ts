import {
  AbiEvent,
  AbiFunction,
  ContractAddress,
  Keystore,
  Mnemonic,
  PersonalMessage,
  Secp256k1,
  TxEnvelopeEip1559,
  TypedData,
} from 'ox-v0'
import {
  create2Options,
  event,
  eventArgs,
  keystore,
  keystoreKeyOptions,
  mnemonic,
  personalMessage,
  seaportAbi,
  seaportArgs,
  transactionEnvelope,
  typedData,
  type Operations,
} from './comparison.js'

export function createOperations(): Operations {
  const fulfillOrder = AbiFunction.fromAbi(seaportAbi, 'fulfillOrder')
  const messageEvent = AbiEvent.from(event)
  const [keystoreKey] = Keystore.pbkdf2(keystoreKeyOptions)

  return {
    abiEventEncode: () => AbiEvent.encode(messageEvent, eventArgs),
    abiFunctionEncodeDataCached: () =>
      AbiFunction.encodeData(fulfillOrder, seaportArgs),
    abiFunctionEncodeDataDynamic: () =>
      AbiFunction.encodeData(seaportAbi, 'fulfillOrder', seaportArgs),
    contractAddressFromCreate2: () =>
      ContractAddress.fromCreate2(create2Options),
    keystoreDecrypt: () => Keystore.decrypt(keystore, keystoreKey),
    mnemonicToPrivateKey: () => Mnemonic.toPrivateKey(mnemonic, { as: 'Hex' }),
    personalMessageGetSignPayload: () =>
      PersonalMessage.getSignPayload(personalMessage),
    secp256k1RandomPrivateKey: () => Secp256k1.randomPrivateKey(),
    transactionEnvelopeGetSignPayload: () =>
      TxEnvelopeEip1559.getSignPayload(transactionEnvelope),
    typedDataGetSignPayload: () => TypedData.getSignPayload(typedData),
  }
}
