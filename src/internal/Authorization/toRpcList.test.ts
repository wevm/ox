import { Authorization } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Authorization.toRpcList([
      {
        chainId: 1,
        contractAddress: '0x0000000000000000000000000000000000000000',
        nonce: 1n,
        r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
        yParity: 0,
      },
    ]),
  ).toMatchInlineSnapshot(`
    [
      {
        "chainId": "0x01",
        "contractAddress": "0x0000000000000000000000000000000000000000",
        "nonce": "0x01",
        "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
        "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
        "yParity": "0x0",
      },
    ]
  `)
})
