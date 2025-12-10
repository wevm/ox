import { Transaction } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

describe('fromRpc', () => {
  test('default', () => {
    const transaction = Transaction.fromRpc({
      accessList: [],
      calls: [
        {
          input: '0xdeadbeef',
          to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          value: '0x9b6e64a8ec60000',
        },
      ],
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x1',
      hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      nonce: '0x357',
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: '0x12f296f',
      transactionIndex: '0x2',
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: '0x43f5d',
      gasPrice: '0x2ca6ae494',
      signature: {
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        v: '0x0',
        type: 'secp256k1',
        yParity: '0x0',
      },
      chainId: '0x1',
      type: '0x76',
    })
    expect(transaction).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": 19868015n,
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "value": 700000000000000000n,
          },
        ],
        "chainId": 1,
        "data": undefined,
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gas": 278365n,
        "gasPrice": 11985937556n,
        "hash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "maxFeePerGas": 2n,
        "maxPriorityFeePerGas": 1n,
        "nonce": 855n,
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "transactionIndex": 2,
        "type": "tempo",
        "value": 0n,
      }
    `)
  })

  test('with feePayerSignature', () => {
    const transaction = Transaction.fromRpc({
      accessList: [],
      calls: [
        {
          input: '0xdeadbeef',
          to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          value: '0x9b6e64a8ec60000',
        },
      ],
      feePayerSignature: {
        r: '0x12f4d9e9924f62b19de816252efc125006298f43e62d394151e62600e2c2f91e',
        s: '0x31daa78bb3e95dd22f6370e59617c60d109bf28e55c92b25994ddbed420e2a80',
        v: '0x0',
        yParity: '0x0',
      },
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x1',
      hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      nonce: '0x357',
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: '0x12f296f',
      transactionIndex: '0x2',
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: '0x43f5d',
      gasPrice: '0x2ca6ae494',
      signature: {
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        v: '0x0',
        type: 'secp256k1',
        yParity: '0x0',
      },
      chainId: '0x1',
      type: '0x76',
    })

    expect(transaction).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": 19868015n,
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "value": 700000000000000000n,
          },
        ],
        "chainId": 1,
        "data": undefined,
        "feePayerSignature": {
          "r": 8574245934337799659042750864278046211314109527666697413298781631396794530078n,
          "s": 22549658598721143185960614158212618570884225122794367192341714237232002247296n,
          "v": 27,
          "yParity": 0,
        },
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gas": 278365n,
        "gasPrice": 11985937556n,
        "hash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "maxFeePerGas": 2n,
        "maxPriorityFeePerGas": 1n,
        "nonce": 855n,
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "transactionIndex": 2,
        "type": "tempo",
        "value": 0n,
      }
    `)
  })

  test('with keyAuthorization', () => {
    const transaction = Transaction.fromRpc({
      accessList: [],
      calls: [
        {
          input: '0xdeadbeef',
          to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          value: '0x9b6e64a8ec60000',
        },
      ],
      keyAuthorization: {
        expiry: '0xffffffffffff',
        keyId: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        keyType: 'secp256k1',
        limits: [
          {
            token: '0x20c0000000000000000000000000000000000001',
            limit: '0x8ac7230489e80000',
          },
        ],
        signature: {
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
          type: 'secp256k1',
          yParity: '0x0',
        },
      },
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x1',
      hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      nonce: '0x357',
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: '0x12f296f',
      transactionIndex: '0x2',
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: '0x43f5d',
      gasPrice: '0x2ca6ae494',
      signature: {
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        v: '0x0',
        type: 'secp256k1',
        yParity: '0x0',
      },
      chainId: '0x1',
      type: '0x76',
    })

    expect(transaction).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": 19868015n,
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "value": 700000000000000000n,
          },
        ],
        "chainId": 1,
        "data": undefined,
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gas": 278365n,
        "gasPrice": 11985937556n,
        "hash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "keyAuthorization": {
          "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "chainId": 0n,
          "expiry": 281474976710655,
          "limits": [
            {
              "limit": 10000000000000000000n,
              "token": "0x20c0000000000000000000000000000000000001",
            },
          ],
          "signature": {
            "signature": {
              "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
              "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
              "yParity": 0,
            },
            "type": "secp256k1",
          },
          "type": "secp256k1",
        },
        "maxFeePerGas": 2n,
        "maxPriorityFeePerGas": 1n,
        "nonce": 855n,
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "transactionIndex": 2,
        "type": "tempo",
        "value": 0n,
      }
    `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    const transaction = Transaction.toRpc({
      accessList: [],
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: 19868015n,
      calls: [
        {
          data: '0xdeadbeef',
          to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          value: 700000000000000000n,
        },
      ],
      chainId: 1,
      data: undefined,
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: 278365n,
      gasPrice: 11985937556n,
      hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      maxFeePerGas: 2n,
      maxPriorityFeePerGas: 1n,
      nonce: 855n,
      signature: {
        signature: {
          r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
          s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
          yParity: 0,
        },
        type: 'secp256k1',
      },
      transactionIndex: 2,
      type: 'tempo',
    })
    expect(transaction).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": "0x12f296f",
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "value": "0x9b6e64a8ec60000",
          },
        ],
        "chainId": "0x1",
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gas": "0x43f5d",
        "gasPrice": "0x2ca6ae494",
        "hash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "input": undefined,
        "maxFeePerGas": "0x2",
        "maxPriorityFeePerGas": "0x1",
        "nonce": "0x357",
        "signature": {
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "type": "secp256k1",
          "yParity": "0x0",
        },
        "to": undefined,
        "transactionIndex": "0x2",
        "type": "0x76",
        "value": "0x0",
      }
    `)
  })

  test('default', () => {
    const transaction = Transaction.toRpc({
      accessList: [],
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: 19868015n,
      calls: [
        {
          data: '0xdeadbeef',
          to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          value: 700000000000000000n,
        },
      ],
      chainId: 1,
      data: undefined,
      feePayerSignature: {
        r: 8574245934337799659042750864278046211314109527666697413298781631396794530078n,
        s: 22549658598721143185960614158212618570884225122794367192341714237232002247296n,
        v: 27,
        yParity: 0,
      },
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: 278365n,
      gasPrice: 11985937556n,
      hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      maxFeePerGas: 2n,
      maxPriorityFeePerGas: 1n,
      nonce: 855n,
      signature: {
        signature: {
          r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
          s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
          yParity: 0,
        },
        type: 'secp256k1',
      },
      transactionIndex: 2,
      type: 'tempo',
    })
    expect(transaction).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": "0x12f296f",
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "value": "0x9b6e64a8ec60000",
          },
        ],
        "chainId": "0x1",
        "feePayerSignature": {
          "r": "0x12f4d9e9924f62b19de816252efc125006298f43e62d394151e62600e2c2f91e",
          "s": "0x31daa78bb3e95dd22f6370e59617c60d109bf28e55c92b25994ddbed420e2a80",
          "v": "0x1b",
          "yParity": "0x0",
        },
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gas": "0x43f5d",
        "gasPrice": "0x2ca6ae494",
        "hash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "input": undefined,
        "maxFeePerGas": "0x2",
        "maxPriorityFeePerGas": "0x1",
        "nonce": "0x357",
        "signature": {
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "type": "secp256k1",
          "yParity": "0x0",
        },
        "to": undefined,
        "transactionIndex": "0x2",
        "type": "0x76",
        "value": "0x0",
      }
    `)
  })

  test('with keyAuthorization', () => {
    const transaction = Transaction.toRpc({
      accessList: [],
      blockHash:
        '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
      blockNumber: 19868015n,
      calls: [
        {
          data: '0xdeadbeef',
          to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
          value: 700000000000000000n,
        },
      ],
      chainId: 1,
      data: undefined,
      keyAuthorization: {
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        expiry: 281474976710655,
        type: 'secp256k1',
        limits: [
          {
            limit: 10000000000000000000n,
            token: '0x20c0000000000000000000000000000000000001',
          },
        ],
        signature: {
          signature: {
            r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            yParity: 0,
          },
          type: 'secp256k1',
        },
      },
      feeToken: '0x20c0000000000000000000000000000000000000',
      from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
      gas: 278365n,
      gasPrice: 11985937556n,
      hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
      maxFeePerGas: 2n,
      maxPriorityFeePerGas: 1n,
      nonce: 855n,
      signature: {
        signature: {
          r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
          s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
          yParity: 0,
        },
        type: 'secp256k1',
      },
      transactionIndex: 2,
      type: 'tempo',
    })
    expect(transaction).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "blockHash": "0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b",
        "blockNumber": "0x12f296f",
        "calls": [
          {
            "data": "0xdeadbeef",
            "to": "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
            "value": "0x9b6e64a8ec60000",
          },
        ],
        "chainId": "0x1",
        "feeToken": "0x20c0000000000000000000000000000000000000",
        "from": "0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6",
        "gas": "0x43f5d",
        "gasPrice": "0x2ca6ae494",
        "hash": "0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0",
        "input": undefined,
        "keyAuthorization": {
          "chainId": "0x",
          "expiry": "0xffffffffffff",
          "keyId": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "keyType": "secp256k1",
          "limits": [
            {
              "limit": "0x8ac7230489e80000",
              "token": "0x20c0000000000000000000000000000000000001",
            },
          ],
          "signature": {
            "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
            "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
            "type": "secp256k1",
            "yParity": "0x0",
          },
        },
        "maxFeePerGas": "0x2",
        "maxPriorityFeePerGas": "0x1",
        "nonce": "0x357",
        "signature": {
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "type": "secp256k1",
          "yParity": "0x0",
        },
        "to": undefined,
        "transactionIndex": "0x2",
        "type": "0x76",
        "value": "0x0",
      }
    `)
  })
})
