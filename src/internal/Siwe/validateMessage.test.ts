import { Siwe } from 'ox'
import { expect, test, vi } from 'vitest'

const message = {
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  chainId: 1,
  domain: 'example.com',
  nonce: 'foobarbaz',
  uri: 'https://example.com/path',
  version: '1',
} satisfies Siwe.Message

test('default', () => {
  expect(
    Siwe.validateMessage({
      message,
    }),
  ).toBeTruthy()
})

test('behavior: invalid address', () => {
  expect(
    Siwe.validateMessage({
      message: {
        ...message,
        address: undefined,
      },
    }),
  ).toBeFalsy()
})

test('behavior: address mismatch', () => {
  expect(
    Siwe.validateMessage({
      address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
      message,
    }),
  ).toBeFalsy()
})

test('behavior: invalid address', () => {
  expect(
    Siwe.validateMessage({
      address: '0xfoobarbaz',
      message,
    }),
  ).toBeFalsy()
})

test('behavior: domain mismatch', () => {
  expect(
    Siwe.validateMessage({
      domain: 'viem.sh',
      message,
    }),
  ).toBeFalsy()
})

test('behavior: nonce mismatch', () => {
  expect(
    Siwe.validateMessage({
      nonce: 'f0obarbaz',
      message,
    }),
  ).toBeFalsy()
})

test('behavior: scheme mismatch', () => {
  expect(
    Siwe.validateMessage({
      scheme: 'http',
      message: {
        ...message,
        scheme: 'https',
      },
    }),
  ).toBeFalsy()
})

test('behavior: time is after expirationTime', () => {
  expect(
    Siwe.validateMessage({
      message: {
        ...message,
        expirationTime: new Date(Date.UTC(2024, 1, 1)),
      },
      time: new Date(Date.UTC(2025, 1, 1)),
    }),
  ).toBeFalsy()
})

test('behavior: time is before notBefore', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

  expect(
    Siwe.validateMessage({
      message: {
        ...message,
        notBefore: new Date(Date.UTC(2024, 1, 1)),
      },
      time: new Date(Date.UTC(2023, 1, 1)),
    }),
  ).toBeFalsy()

  vi.useRealTimers()
})
