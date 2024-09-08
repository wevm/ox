import { AbiError_from } from './from.js'

// https://docs.soliditylang.org/en/v0.8.16/control-structures.html#panic-via-assert-and-error-via-require
export const AbiError_panicReasons = {
  1: 'An `assert` condition failed.',
  17: 'Arithmetic operation resulted in underflow or overflow.',
  18: 'Division or modulo by zero (e.g. `5 / 0` or `23 % 0`).',
  33: 'Attempted to convert to an invalid type.',
  34: 'Attempted to access a storage byte array that is incorrectly encoded.',
  49: 'Performed `.pop()` on an empty array',
  50: 'Array index is out of bounds.',
  65: 'Allocated too much memory or created an array which is too large.',
  81: 'Attempted to call a zero-initialized variable of internal function type.',
} as Record<number, string>

export const AbiError_solidityError = /*#__PURE__*/ AbiError_from({
  inputs: [
    {
      name: 'message',
      type: 'string',
    },
  ],
  name: 'Error',
  type: 'error',
})

export const AbiError_solidityErrorSelector = '0x08c379a0'

export const AbiError_solidityPanic = /*#__PURE__*/ AbiError_from({
  inputs: [
    {
      name: 'reason',
      type: 'uint8',
    },
  ],
  name: 'Panic',
  type: 'error',
})

export const AbiError_solidityPanicSelector = '0x4e487b71'
