import { Hash } from 'ox'
import { expect, test } from 'vitest'

test('checks if hash is valid', () => {
  expect(Hash.isHash('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac')).toBeFalsy()
  expect(Hash.isHash('0xa0cf798816d4b9b9866b5330eea46a18382f251e')).toBeFalsy()
  expect(Hash.isHash('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az')).toBeFalsy()
  expect(Hash.isHash('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff')).toBeFalsy()
  expect(Hash.isHash('a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac')).toBeFalsy()
  expect(
    Hash.isHash(
      '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    ),
  ).toBeTruthy()
})
