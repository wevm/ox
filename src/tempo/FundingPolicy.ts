import * as AbiParameters from '../core/AbiParameters.js'
import * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'

/** An approved funding source and its configuration data. */
export type Source = {
  /** Source-specific configuration passed to funding hooks as `configData`. */
  data: Hex.Hex
  /** Funding source address. */
  to: Address.Address
}

/**
 * Funding permissions, represented by output token. */
export type Rules = {
  /**
   * Maximum aggregate slippage in basis points. */
  maxSlippageBps: number
  /**
   * Ordered source permissions for each output token. */
  sources: Readonly<Record<Address.Address, readonly Source[]>>
}

/**
 * Inline policy creation parameters. */
export type Inline = {
  /**
   * Accounts authorized to modify the policy. */
  admins: readonly Address.Address[]
  /**
   * Committed funding permissions. */
  rules: Rules
}

/**
 * Policy authorization: an existing nonzero uint64 ID or inline creation. */
export type Authorization<bigintType = bigint> = bigintType | Inline

/** Policy authorization in RPC form. */
export type Rpc =
  | Hex.Hex
  | {
      /** Accounts authorized to modify the policy. */
      admins: readonly Address.Address[]
      /** Committed funding permissions. */
      rules: {
        /** Maximum aggregate slippage in basis points. */
        maxSlippageBps: number
        /** Ordered source permissions for each output token. */
        sources: Readonly<Record<Address.Address, Route['sources']>>
      }
    }

/**
 * Policy state returned by the precompile; rules are available in events. */
export type Policy = {
  /**
   * Accounts authorized to modify the policy. */
  admins: readonly Address.Address[]
  /**
   * Domain-separated commitment to canonical rules. */
  rulesHash: Hex.Hex
}

/**
 * ABI representation of one output route. */
export type Route = {
  /**
   * Output token. */
  token: Address.Address
  /**
   * Ordered source permissions. */
  sources: readonly {
    /** Funding source address in the contract ABI. */
    target: Address.Address
    /** Source-specific configuration passed to funding hooks as `configData`. */
    data: Hex.Hex
  }[]
}

/**
 * RLP policy authorization. */
export type Tuple =
  | Hex.Hex
  | readonly [
      admins: readonly Hex.Hex[],
      rules: readonly [
        Hex.Hex,
        readonly (readonly [
          Hex.Hex,
          readonly (readonly [Hex.Hex, Hex.Hex])[],
        ])[],
      ],
    ]

const parameters = [
  {
    type: 'tuple',
    components: [
      { name: 'maxSlippageBps', type: 'uint16' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'token', type: 'address' },
          {
            name: 'sources',
            type: 'tuple[]',
            components: [
              { name: 'target', type: 'address' },
              { name: 'data', type: 'bytes' },
            ],
          },
        ],
      },
    ],
  },
] as const

const domain = Hash.keccak256(Hex.fromString('tempo.funding-policy.rules.v1'))

/**
 * Converts a token map to canonical ABI routes, mapping `to` to `target` without reordering sources.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * const rules = { maxSlippageBps: 100, sources: {} }
 * FundingPolicy.toRoutes(rules)
 * ```
 */
export function toRoutes(rules: Rules): readonly Route[] {
  if (
    !Number.isInteger(rules.maxSlippageBps) ||
    rules.maxSlippageBps < 0 ||
    rules.maxSlippageBps > 10_000
  )
    throw new InvalidPolicyError(
      'Slippage must be between 0 and 10,000 basis points.',
    )
  const seen = new Set<string>()
  const routes = Object.entries(rules.sources).map(([token, sources]) => {
    Address.assert(token, { strict: false })
    if (BigInt(token) === 0n || seen.has(token.toLowerCase()))
      throw new InvalidPolicyError('Output tokens must be unique and nonzero.')
    seen.add(token.toLowerCase())
    for (const { to, data } of sources) {
      Address.assert(to, { strict: false })
      if (
        BigInt(to) === 0n ||
        !Hex.validate(data, { strict: true }) ||
        data.length % 2 !== 0
      )
        throw new InvalidPolicyError('Invalid source address or data.')
    }
    return {
      token,
      sources: sources.map(({ to, data }) => ({ target: to, data })),
    }
  })
  return routes.sort((a, b) => (BigInt(a.token) < BigInt(b.token) ? -1 : 1))
}

/**
 * ABI-encodes complete rules for a transaction's `policyRules` field.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * const rules = { maxSlippageBps: 100, sources: {} }
 * FundingPolicy.encode(rules)
 * ```
 */
export function encode(rules: Rules): Hex.Hex {
  return AbiParameters.encode(parameters, [
    { maxSlippageBps: rules.maxSlippageBps, routes: toRoutes(rules) },
  ])
}

/**
 * Decodes canonical ABI rules, rejecting noncanonical or trailing bytes.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * const rules = { maxSlippageBps: 100, sources: {} }
 * FundingPolicy.decode(FundingPolicy.encode(rules))
 * ```
 */
export function decode(data: Hex.Hex): Rules {
  const [value] = AbiParameters.decode(parameters, data)
  const rules: Rules = {
    maxSlippageBps: value.maxSlippageBps,
    sources: Object.fromEntries(
      value.routes.map(({ token, sources }) => [
        token,
        sources.map(({ target, data }) => ({ to: target, data })),
      ]),
    ),
  }
  if (encode(rules).toLowerCase() !== data.toLowerCase())
    throw new InvalidPolicyError(
      'Policy rules must use canonical ABI encoding.',
    )
  return rules
}

/**
 * Computes the protocol's domain-separated commitment to rules.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * const rules = { maxSlippageBps: 100, sources: {} }
 * FundingPolicy.hash(rules)
 * ```
 */
export function hash(rules: Rules): Hex.Hex {
  return Hash.keccak256(
    AbiParameters.encode(AbiParameters.from('bytes32, bytes'), [
      domain,
      encode(rules),
    ]),
  )
}

/**
 * Encodes an existing policy ID or an inline policy as an RLP tuple.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * FundingPolicy.toTuple(7n)
 * ```
 */
export function toTuple(value: Authorization): Tuple {
  if (
    typeof value !== 'bigint' &&
    (typeof value !== 'object' || value === null)
  )
    throw new InvalidPolicyError(
      'Funding policy must be resolved before signing.',
    )

  if (typeof value === 'bigint') {
    if (value <= 0n || value >= 2n ** 64n)
      throw new InvalidPolicyError('Policy ID must be a nonzero uint64.')
    return Hex.fromNumber(value)
  }
  const seen = new Set<string>()
  if (!value.admins.length)
    throw new InvalidPolicyError('At least one admin is required.')
  for (const admin of value.admins) {
    Address.assert(admin, { strict: false })
    if (BigInt(admin) === 0n || seen.has(admin.toLowerCase()))
      throw new InvalidPolicyError('Admins must be unique and nonzero.')
    seen.add(admin.toLowerCase())
  }
  return [
    value.admins,
    [
      value.rules.maxSlippageBps === 0
        ? '0x'
        : Hex.fromNumber(value.rules.maxSlippageBps),
      toRoutes(value.rules).map(
        ({ token, sources }) =>
          [
            token,
            sources.map(({ target, data }) => [target, data] as const),
          ] as const,
      ),
    ],
  ]
}

/**
 * Decodes a canonical policy authorization tuple.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * FundingPolicy.fromTuple('0x07')
 * ```
 */
export function fromTuple(value: Tuple): Authorization {
  if (typeof value === 'string') {
    if (
      !Hex.validate(value, { strict: true }) ||
      value === '0x' ||
      value.startsWith('0x00')
    )
      throw new InvalidPolicyError('Invalid policy ID encoding.')
    const id = BigInt(value)
    toTuple(id)
    return id
  }
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !Array.isArray(value[0]) ||
    !Array.isArray(value[1]) ||
    value[1].length !== 2
  )
    throw new InvalidPolicyError('Invalid inline policy tuple.')
  const [admins, [slippage, routes]] = value
  if (
    typeof slippage !== 'string' ||
    !Hex.validate(slippage, { strict: true }) ||
    slippage.startsWith('0x00') ||
    !Array.isArray(routes)
  )
    throw new InvalidPolicyError('Invalid policy rules tuple.')
  const sources: Record<Address.Address, readonly Source[]> = {}
  let previous = -1n
  for (const route of routes) {
    if (!Array.isArray(route) || route.length !== 2 || !Array.isArray(route[1]))
      throw new InvalidPolicyError('Invalid route tuple.')
    const [token, entries] = route
    Address.assert(token, { strict: false })
    if (BigInt(token) <= previous)
      throw new InvalidPolicyError('Routes must be in ascending token order.')
    previous = BigInt(token)
    sources[token] = entries.map((source) => {
      if (!Array.isArray(source) || source.length !== 2)
        throw new InvalidPolicyError('Invalid source tuple.')
      return { to: source[0], data: source[1] }
    })
  }
  const policy = {
    admins,
    rules: {
      maxSlippageBps: slippage === '0x' ? 0 : Number(slippage),
      sources,
    },
  }
  toTuple(policy)
  return policy
}

/**
 * Converts an RPC policy authorization to its domain representation.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * FundingPolicy.fromRpc('0x7')
 * ```
 */
export function fromRpc(value: Rpc): Authorization {
  const result =
    typeof value === 'string'
      ? BigInt(value)
      : {
          ...value,
          rules: {
            ...value.rules,
            sources: Object.fromEntries(
              Object.entries(value.rules.sources).map(([token, sources]) => [
                token,
                sources.map(({ target, data }) => ({ to: target, data })),
              ]),
            ),
          },
        }
  toTuple(result)
  return result
}

/**
 * Converts a policy authorization to its RPC representation.
 *
 * @example
 * ```ts
 * import { FundingPolicy } from 'ox/tempo'
 *
 * FundingPolicy.toRpc(7n)
 * ```
 */
export function toRpc(value: Authorization<bigint | number | Hex.Hex>): Rpc {
  if (typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isSafeInteger(value))
      throw new InvalidPolicyError('Numeric policy IDs must be safe integers.')
    const id = BigInt(value)
    toTuple(id)
    return Hex.fromNumber(id)
  }
  toTuple(value)
  return {
    ...value,
    rules: {
      ...value.rules,
      sources: Object.fromEntries(
        toRoutes(value.rules).map(({ token, sources }) => [token, sources]),
      ),
    },
  }
}

/**
 * Thrown when a funding policy cannot be canonically encoded. */
export class InvalidPolicyError extends Errors.BaseError {
  override readonly name = 'FundingPolicy.InvalidPolicyError'
}
