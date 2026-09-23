import * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as Quantity from '../core/internal/quantity.js'

/**
 * A concrete call to a funding source. */
export type Source = {
  /**
   * Source-specific ABI-encoded request. */
  data: Hex.Hex
  /**
   * Funding source address. */
  target: Address.Address
}

/**
 * Target balance to satisfy before application calls. */
export type FundingRequirement<bigintType = bigint, numberType = number> = {
  /**
   * Requested output token. */
  token: Address.Address
  /**
   * Target balance, including existing funds, in token base units. */
  amount: bigintType
  /**
   * Canonical policy rules for access key funding. Owners omit this field. */
  policyRules?: Hex.Hex | undefined
  /**
   * Aggregate slippage in basis points. Omission uses the protocol default. */
  slippageBps?: numberType | undefined
  /**
   * Sources attempted in order. */
  sources: readonly Source[]
}

/**
 * RPC funding requirement. */
export type Rpc = FundingRequirement<Hex.Hex, Hex.Hex>

/**
 * RLP funding requirement tuple. */
export type Tuple = readonly [
  token: Hex.Hex,
  amount: Hex.Hex,
  sources: readonly (readonly [Hex.Hex, Hex.Hex])[],
  slippage: readonly Hex.Hex[],
  ...policyRules: [] | [Hex.Hex],
]

/**
 * Validates a funding requirement's signed fields.
 *
 * @example
 * ```ts
 * import { FundingRequirement } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingRequirement.assert({
 *   token,
 *   amount: 50n,
 *   sources: []
 * })
 * ```
 */
export function assert(value: FundingRequirement): void {
  Address.assert(value.token, { strict: false })
  if (value.amount < 0n || value.amount >= 2n ** 256n)
    throw new InvalidRequirementError('Amount must fit uint256.')
  if (
    value.slippageBps !== undefined &&
    (!Number.isInteger(value.slippageBps) ||
      value.slippageBps < 0 ||
      value.slippageBps > 10_000)
  )
    throw new InvalidRequirementError(
      'Slippage must be between 0 and 10,000 basis points.',
    )
  if (
    value.policyRules !== undefined &&
    (!Hex.validate(value.policyRules, { strict: true }) ||
      value.policyRules === '0x' ||
      value.policyRules.length % 2 !== 0)
  )
    throw new InvalidRequirementError('Policy rules must be nonempty bytes.')
  for (const source of value.sources) {
    Address.assert(source.target, { strict: false })
    if (
      !Hex.validate(source.data, { strict: true }) ||
      source.data.length % 2 !== 0
    )
      throw new InvalidRequirementError('Source data must be bytes.')
  }
}

/**
 * Creates and validates a funding requirement, preserving inferred literal types.
 *
 * @example
 * ```ts
 * import { FundingRequirement } from 'ox/tempo'
 *
 * const requirement = FundingRequirement.from({
 *   token: '0x20c0000000000000000000000000000000000001',
 *   amount: 50n,
 *   sources: []
 * })
 * ```
 */
export function from<const requirement extends FundingRequirement>(
  requirement: requirement,
): requirement {
  assert(requirement)
  return requirement
}

/**
 * Converts a funding requirement to its RLP tuple.
 *
 * @example
 * ```ts
 * import { FundingRequirement } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingRequirement.toTuple({
 *   token,
 *   amount: 50n,
 *   sources: []
 * })
 * ```
 */
export function toTuple(value: FundingRequirement): Tuple {
  assert(value)
  return [
    value.token,
    value.amount === 0n ? '0x' : Hex.fromNumber(BigInt(value.amount)),
    value.sources.map(({ target, data }) => [target, data] as const),
    value.slippageBps === undefined
      ? []
      : [
          value.slippageBps === 0
            ? '0x'
            : Hex.fromNumber(Number(value.slippageBps)),
        ],
    ...((value.policyRules === undefined ? [] : [value.policyRules]) as
      | []
      | [Hex.Hex]),
  ]
}

/**
 * Decodes a funding requirement from its RLP tuple.
 *
 * @example
 * ```ts
 * import { FundingRequirement } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingRequirement.fromTuple([token, '0x32', [], []])
 * ```
 */
export function fromTuple(value: Tuple): FundingRequirement {
  if (!Array.isArray(value) || (value.length !== 4 && value.length !== 5))
    throw new InvalidRequirementError('Expected four or five funding fields.')
  const [token, amount, sources, slippage, policyRules] = value
  if (
    !Array.isArray(sources) ||
    !Array.isArray(slippage) ||
    slippage.length > 1
  )
    throw new InvalidRequirementError('Invalid source or slippage list.')
  const decode = (hex: Hex.Hex) => {
    if (
      typeof hex !== 'string' ||
      !Hex.validate(hex, { strict: true }) ||
      hex.startsWith('0x00')
    )
      throw new InvalidRequirementError('Noncanonical funding integer.')
    return hex === '0x' ? 0n : BigInt(hex)
  }
  const requirement: FundingRequirement = {
    token,
    amount: decode(amount),
    sources: sources.map((source) => {
      if (!Array.isArray(source) || source.length !== 2)
        throw new InvalidRequirementError('Expected source target and data.')
      return { target: source[0], data: source[1] }
    }),
    ...(slippage.length ? { slippageBps: Number(decode(slippage[0]!)) } : {}),
    ...(policyRules !== undefined ? { policyRules } : {}),
  }
  assert(requirement)
  return requirement
}

/**
 * Converts RPC quantities to a funding requirement.
 *
 * @example
 * ```ts
 * import { FundingRequirement } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingRequirement.fromRpc({
 *   token,
 *   amount: '0x32',
 *   sources: []
 * })
 * ```
 */
export function fromRpc(value: Rpc): FundingRequirement {
  const { amount, slippageBps, ...rest } = value
  const result: FundingRequirement = {
    ...rest,
    amount: BigInt(amount),
    ...(slippageBps === undefined ? {} : { slippageBps: Number(slippageBps) }),
  }
  assert(result)
  return result
}

/**
 * Converts a funding requirement to RPC quantities.
 *
 * @example
 * ```ts
 * import { FundingRequirement } from 'ox/tempo'
 *
 * const token =
 *   '0x20c0000000000000000000000000000000000001' as const
 * FundingRequirement.toRpc({
 *   token,
 *   amount: 50n,
 *   sources: []
 * })
 * ```
 */
export function toRpc(
  value: FundingRequirement<bigint | number | Hex.Hex, number | Hex.Hex>,
): Rpc {
  assert({
    ...value,
    amount: BigInt(value.amount),
    slippageBps:
      value.slippageBps === undefined ? undefined : Number(value.slippageBps),
  })
  const { amount, slippageBps, ...rest } = value
  return {
    ...rest,
    amount: Quantity.fromNumberish(amount),
    ...(slippageBps === undefined
      ? {}
      : { slippageBps: Quantity.fromNumberish(slippageBps) }),
  }
}

/**
 * Thrown when funding fields violate the protocol encoding. */
export class InvalidRequirementError extends Errors.BaseError {
  override readonly name = 'FundingRequirement.InvalidRequirementError'
  constructor(message: string) {
    super(message)
  }
}
