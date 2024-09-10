export const TransactionReceipt_status = {
  '0x0': 'reverted',
  '0x1': 'success',
} as const

export const TransactionReceipt_statusRpc = {
  reverted: '0x0',
  success: '0x1',
} as const

export const TransactionReceipt_type = {
  '0x0': 'legacy',
  '0x1': 'eip2930',
  '0x2': 'eip1559',
  '0x3': 'eip4844',
  '0x4': 'eip7702',
} as const

export const TransactionReceipt_typeRpc = {
  legacy: '0x0',
  eip2930: '0x1',
  eip1559: '0x2',
  eip4844: '0x3',
  eip7702: '0x4',
} as const
