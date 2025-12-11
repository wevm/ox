import * as Errors from '../core/Errors.js'

/**
 * Minimum allowed tick value (-2% from peg).
 *
 * [Stablecoin DEX Pricing](https://docs.tempo.xyz/protocol/exchange/spec#key-concepts)
 */
export const minTick = -2000

/**
 * Maximum allowed tick value (+2% from peg).
 *
 * [Stablecoin DEX Pricing](https://docs.tempo.xyz/protocol/exchange/spec#key-concepts)
 */
export const maxTick = 2000

/**
 * Price scaling factor (5 decimal places for 0.1 bps precision).
 *
 * The DEX uses a tick-based pricing system where `price = PRICE_SCALE + tick`.
 * Orders must be placed at ticks divisible by `TICK_SPACING = 10` (1 bp grid).
 *
 * [Stablecoin DEX Pricing](https://docs.tempo.xyz/protocol/exchange/spec#key-concepts)
 */
export const priceScale = 100_000

/**
 * Tick type.
 */
export type Tick = number

/**
 * Converts a tick to a price string.
 *
 * [Stablecoin DEX Pricing](https://docs.tempo.xyz/protocol/exchange/spec#key-concepts)
 *
 * @example
 * ```ts
 * import { Tick } from 'ox/tempo'
 *
 * // Tick 0 = price of 1.0
 * const price1 = Tick.toPrice(0) // "1"
 *
 * // Tick 100 = price of 1.001 (0.1% higher)
 * const price2 = Tick.toPrice(100) // "1.001"
 *
 * // Tick -100 = price of 0.999 (0.1% lower)
 * const price3 = Tick.toPrice(-100) // "0.999"
 * ```
 *
 * @param tick - The tick value (range: -2000 to +2000).
 * @returns The price as a string with exact decimal representation.
 * @throws `TickOutOfBoundsError` If tick is out of bounds.
 */
export function toPrice(tick: toPrice.Tick): toPrice.ReturnType {
  if (tick < minTick || tick > maxTick) {
    throw new TickOutOfBoundsError({ tick })
  }
  // Use integer arithmetic to avoid floating point errors
  const price = priceScale + tick
  const whole = Math.floor(price / priceScale)

  let decimal = (price % priceScale).toString().padStart(5, '0')
  decimal = decimal.replace(/0+$/, '')

  if (decimal.length === 0) return whole.toString()
  return `${whole}.${decimal}`
}

export declare namespace toPrice {
  export type Tick = number
  export type ReturnType = string
}

/**
 * Converts a price string to a tick.
 *
 * [Stablecoin DEX Pricing](https://docs.tempo.xyz/protocol/exchange/spec#key-concepts)
 *
 * @example
 * ```ts
 * import { Tick } from 'ox/tempo'
 *
 * // Price of 1.0 = tick 0
 * const tick1 = Tick.fromPrice('1.0') // 0
 * const tick2 = Tick.fromPrice('1.00000') // 0
 *
 * // Price of 1.001 = tick 100
 * const tick3 = Tick.fromPrice('1.001') // 100
 *
 * // Price of 0.999 = tick -100
 * const tick4 = Tick.fromPrice('0.999') // -100
 * ```
 *
 * @param price - The price as a string (e.g., "1.001", "0.999").
 * @returns The tick value.
 */
export function fromPrice(price: fromPrice.Price): fromPrice.ReturnType {
  const priceStr = price.trim()
  if (!/^-?\d+(\.\d+)?$/.test(priceStr))
    throw new InvalidPriceFormatError({ price })

  // Parse price using string manipulation to avoid float precision issues
  const [w, d = '0'] = priceStr.split('.')
  const whole = BigInt(w!)

  // Pad or truncate decimal to exactly 5 digits
  const decimal = BigInt(d.padEnd(5, '0').slice(0, 5))

  // Calculate price
  const priceInt = whole * BigInt(priceScale) + decimal

  // Calculate tick
  const tick = Number(priceInt - BigInt(priceScale))

  if (tick < minTick || tick > maxTick)
    throw new PriceOutOfBoundsError({ price, tick })

  return tick
}

export declare namespace fromPrice {
  export type Price = string
  export type ReturnType = number
}

/**
 * Error thrown when a tick value is out of the allowed bounds.
 */
export class TickOutOfBoundsError extends Errors.BaseError {
  override readonly name = 'Tick.TickOutOfBoundsError'

  constructor(options: TickOutOfBoundsError.Options) {
    super(`Tick ${options.tick} is out of bounds.`, {
      metaMessages: [`Tick must be between ${minTick} and ${maxTick}.`],
    })
  }
}

export declare namespace TickOutOfBoundsError {
  export type Options = {
    tick: number
  }
}

/**
 * Error thrown when a price string has an invalid format.
 */
export class InvalidPriceFormatError extends Errors.BaseError {
  override readonly name = 'Tick.InvalidPriceFormatError'

  constructor(options: InvalidPriceFormatError.Options) {
    super(`Invalid price format: "${options.price}".`, {
      metaMessages: ['Price must be a decimal number string (e.g., "1.001").'],
    })
  }
}

export declare namespace InvalidPriceFormatError {
  export type Options = {
    price: string
  }
}

/**
 * Error thrown when a price string results in an out-of-bounds tick.
 */
export class PriceOutOfBoundsError extends Errors.BaseError {
  override readonly name = 'Tick.PriceOutOfBoundsError'

  constructor(options: PriceOutOfBoundsError.Options) {
    super(
      `Price "${options.price}" results in tick ${options.tick} which is out of bounds.`,
      {
        metaMessages: [`Tick must be between ${minTick} and ${maxTick}.`],
      },
    )
  }
}

export declare namespace PriceOutOfBoundsError {
  export type Options = {
    price: string
    tick: number
  }
}
