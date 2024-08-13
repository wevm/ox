export type ErrorType<name extends string = 'Error'> = Error & { name: name }
