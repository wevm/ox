export type GlobalErrorType<name extends string = 'Error'> = Error & {
  name: name
}
