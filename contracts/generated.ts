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
    "object": "0x6080604052348015600e575f5ffd5b5060ec8061001b5f395ff3fe6080604052348015600e575f5ffd5b50600436106026575f3560e01c8063a9059cbb14602a575b5f5ffd5b603960353660046083565b603b565b005b604080516001600160a01b03841681526020810183905233917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a25050565b5f5f604083850312156093575f5ffd5b82356001600160a01b038116811460a8575f5ffd5b94602093909301359350505056fea2646970667358221220f1a43a70e034d64a42c0c02f777280585aecd6e4e9728db86b68a4e4ed0b5b4864736f6c634300081c0033",
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
    "object": "0x6080604052348015600e575f5ffd5b5060d780601a5f395ff3fe608060405260043610601b575f3560e01c80636146195414601f575b5f5ffd5b60256027565b005b336001600160a01b03167f7b2cff6dbed2a9cdb935eb6c46afadba8c4436a7aef48222ff62fce1ece4fcf3345f36604051606293929190606c565b60405180910390a2565b83815260406020820152816040820152818360608301375f818301606090810191909152601f909201601f191601019291505056fea264697066735822122046dd8d3b7894fce95fae19739eff9c19193682f91a782f02f49e69e40af13b1364736f6c634300081c0033",
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
    "object": "0x6080604052348015600e575f5ffd5b5061030f8061001c5f395ff3fe608060405234801561000f575f5ffd5b50600436106100f0575f3560e01c80638de18b9111610093578063c66cf13311610063578063c66cf13314610106578063d44de86614610127578063eb1aba20146100f4578063efbbf9951461013f575f5ffd5b80638de18b91146100fe578063940b8802146101375780639f55870914610137578063a997732e1461012f575f5ffd5b80634a9bc278116100ce5780634a9bc278146101205780634adac6eb14610127578063699389ca1461012057806388452b851461012f575f5ffd5b806304696152146100f45780631515d768146100fe57806324db9ba014610106575b5f5ffd5b6100fc610147565b005b6100fc610151565b61010e6101bb565b60405190815260200160405180910390f35b6100fc5f5ffd5b61010e6101d2565b6100fc6101e2565b6100fc6101fb565b6100fc610243565b61014f61025c565b565b6040805180820182525f815260456020820181815292516336dcc73d60e21b815291516001600160a01b0316600483015291516024820152608060448201526006608482015265313ab3b3b2b960d11b60a4820152606481019190915260c4015b60405180910390fd5b5f604581806101ca8184610270565b949350505050565b5f5f196001826101ca828461028f565b604051631f200c7360e31b81526004016101b2906102b4565b60405162461bcd60e51b815260206004820152601860248201527f54686973206973206120726576657274206d657373616765000000000000000060448201526064016101b2565b6040516333a3b5cd60e11b815260040160405180910390fd5b634e487b7160e01b5f52600160045260245ffd5b5f8261028a57634e487b7160e01b5f52601260045260245ffd5b500490565b808201808211156102ae57634e487b7160e01b5f52601160045260245ffd5b92915050565b602081525f6102ae602083016006815265313ab3b3b2b960d11b60208201526040019056fea2646970667358221220ec17f5501273e76af6d6e55ad15c5a2aa52d876b232a4c083f76967a9eb2688964736f6c634300081c0033",
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
    "object": "0x6080604052348015600e575f5ffd5b5060405160ad38038060ad833981016040819052602991602f565b50506064565b5f5f60408385031215603f575f5ffd5b82516001600160a01b03811681146054575f5ffd5b6020939093015192949293505050565b603e80606f5f395ff3fe60806040525f5ffdfea26469706673582212208b9916d37ad73f2bbfce8faec2ac34926f33b83e62d9f362db436a5b684f215464736f6c634300081c0033",
    "sourceMap": "64:78:0:-:0;;;91:49;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;64:78;;14:351:4;93:6;101;154:2;142:9;133:7;129:23;125:32;122:52;;;170:1;167;160:12;122:52;196:16;;-1:-1:-1;;;;;241:31:4;;231:42;;221:70;;287:1;284;277:12;221:70;355:2;340:18;;;;334:25;310:5;;334:25;;-1:-1:-1;;;14:351:4:o;:::-;64:78:0;;;;;;",
    "linkReferences": {}
  }
} as const;

