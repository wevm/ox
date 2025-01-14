export const address = /*#__PURE__*/ /^0x[a-fA-F0-9]{40}$/

// https://regexr.com/7f7rv
export const tupleAbiParameterType = /^tuple(?<array>(\[(\d*)\])*)$/

// TODO: This looks cool. Need to check the performance of `new RegExp` versus defined inline though.
// https://twitter.com/GabrielVergnaud/status/1622906834343366657
export function execTyped<type>(regex: RegExp, string: string) {
  const match = regex.exec(string)
  return match?.groups as type | undefined
}
