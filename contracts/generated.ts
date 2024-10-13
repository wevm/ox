export const NonConformingEvents = {
  "abi": [
    {
      "type": "function",
      "name": "transfer",
      "inputs": [
        {
          "name": "recipient",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "Transfer",
      "inputs": [
        {
          "name": "from",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "to",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    }
  ],
  "bytecode": {
    "object": "0x6080604052348015600f57600080fd5b5060f28061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063a9059cbb14602d575b600080fd5b603c60383660046086565b603e565b005b604080516001600160a01b03841681526020810183905233917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a25050565b60008060408385031215609857600080fd5b82356001600160a01b038116811460ae57600080fd5b94602093909301359350505056fea26469706673582212202bbb626dad29ce8fdf98c4599d7f6c8e9950ffd43bbb3d49d3415e80d4904a3264736f6c634300081c0033",
    "sourceMap": "64:296:3:-:0;;;;;;;;;;;;;;;;;;;",
    "linkReferences": {}
  }
} as const;

export const Events = {
  "abi": [
    {
      "type": "function",
      "name": "execute",
      "inputs": [],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "event",
      "name": "MessageEmitted",
      "inputs": [
        {
          "name": "to",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "value",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "data",
          "type": "bytes",
          "indexed": false,
          "internalType": "bytes"
        }
      ],
      "anonymous": false
    }
  ],
  "bytecode": {
    "object": "0x6080604052348015600f57600080fd5b5060db80601d6000396000f3fe608060405260043610601c5760003560e01c806361461954146021575b600080fd5b60276029565b005b336001600160a01b03167f7b2cff6dbed2a9cdb935eb6c46afadba8c4436a7aef48222ff62fce1ece4fcf334600036604051606593929190606f565b60405180910390a2565b83815260406020820152816040820152818360608301376000818301606090810191909152601f909201601f191601019291505056fea264697066735822122023e45d06dd10ce83e4a7fe8496cfa847b2c46ee9a477cc699fa111c3820ecd7964736f6c634300081c0033",
    "sourceMap": "64:203:2:-:0;;;;;;;;;;;;;;;;;;;",
    "linkReferences": {}
  }
} as const;

export const Errors = {
  "abi": [
    {
      "type": "function",
      "name": "assertRead",
      "inputs": [],
      "outputs": [],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "assertWrite",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "complexCustomRead",
      "inputs": [],
      "outputs": [],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "complexCustomWrite",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "divideByZeroRead",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "divideByZeroWrite",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "overflowRead",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "overflowWrite",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "requireRead",
      "inputs": [],
      "outputs": [],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "requireWrite",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "revertRead",
      "inputs": [],
      "outputs": [],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "revertWrite",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "simpleCustomRead",
      "inputs": [],
      "outputs": [],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "simpleCustomReadNoArgs",
      "inputs": [],
      "outputs": [],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "simpleCustomWrite",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "error",
      "name": "ComplexError",
      "inputs": [
        {
          "name": "foo",
          "type": "tuple",
          "internalType": "struct Errors.Foo",
          "components": [
            {
              "name": "sender",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "bar",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "name": "message",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "number",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "SimpleError",
      "inputs": [
        {
          "name": "message",
          "type": "string",
          "internalType": "string"
        }
      ]
    },
    {
      "type": "error",
      "name": "SimpleErrorNoArgs",
      "inputs": []
    }
  ],
  "bytecode": {
    "object": "0x6080604052348015600f57600080fd5b506103228061001f6000396000f3fe608060405234801561001057600080fd5b50600436106100f55760003560e01c80638de18b9111610097578063c66cf13311610066578063c66cf1331461010c578063d44de8661461012e578063eb1aba20146100fa578063efbbf9951461014657600080fd5b80638de18b9114610104578063940b88021461013e5780639f5587091461013e578063a997732e1461013657600080fd5b80634a9bc278116100d35780634a9bc278146101265780634adac6eb1461012e578063699389ca1461012657806388452b851461013657600080fd5b806304696152146100fa5780631515d7681461010457806324db9ba01461010c575b600080fd5b61010261014e565b005b610102610158565b6101146101c3565b60405190815260200160405180910390f35b610102600080fd5b6101146101db565b6101026101ed565b610102610206565b61010261024e565b610156610267565b565b6040805180820182526000815260456020820181815292516336dcc73d60e21b815291516001600160a01b0316600483015291516024820152608060448201526006608482015265313ab3b3b2b960d11b60a4820152606481019190915260c4015b60405180910390fd5b6000604581806101d3818461027d565b949350505050565b60006000196001826101d3828461029f565b604051631f200c7360e31b81526004016101ba906102c6565b60405162461bcd60e51b815260206004820152601860248201527f54686973206973206120726576657274206d657373616765000000000000000060448201526064016101ba565b6040516333a3b5cd60e11b815260040160405180910390fd5b634e487b7160e01b600052600160045260246000fd5b60008261029a57634e487b7160e01b600052601260045260246000fd5b500490565b808201808211156102c057634e487b7160e01b600052601160045260246000fd5b92915050565b6020815260006102c0602083016006815265313ab3b3b2b960d11b60208201526040019056fea2646970667358221220a608a22ba150b397ee897073e6a769f36163da622eb2f6e21915921cc3d6485f64736f6c634300081c0033",
    "sourceMap": "64:2024:1:-:0;;;;;;;;;;;;;;;;;;;",
    "linkReferences": {}
  }
} as const;

export const Constructor = {
  "abi": [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_address",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_number",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    }
  ],
  "bytecode": {
    "object": "0x6080604052348015600f57600080fd5b5060405160b438038060b4833981016040819052602a916030565b50506068565b60008060408385031215604257600080fd5b82516001600160a01b0381168114605857600080fd5b6020939093015192949293505050565b603f8060756000396000f3fe6080604052600080fdfea2646970667358221220b5834ab2fae3ffef100bb3e3c3334e77daaadd794503d8114f7d6d34cbfce3d264736f6c634300081c0033",
    "sourceMap": "64:78:0:-:0;;;91:49;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;64:78;;14:351:4;93:6;101;154:2;142:9;133:7;129:23;125:32;122:52;;;170:1;167;160:12;122:52;196:16;;-1:-1:-1;;;;;241:31:4;;231:42;;221:70;;287:1;284;277:12;221:70;355:2;340:18;;;;334:25;310:5;;334:25;;-1:-1:-1;;;14:351:4:o;:::-;64:78:0;;;;;;",
    "linkReferences": {}
  }
} as const;

