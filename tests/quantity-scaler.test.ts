import { describe, it, expect } from 'vitest'
import { scaleQuantity } from '@/lib/quantity-scaler'

describe('Aurelia Mobile — Quantity Scaler Suite', () => {
  it('returns original quantity when base servings equals target servings', () => {
    expect(scaleQuantity('2', 4, 4)).toBe('2')
    expect(scaleQuantity('1/2', 2, 2)).toBe('1/2')
    expect(scaleQuantity('pinch', 4, 4)).toBe('pinch')
  })

  it('handles invalid, empty, or zero servings safely', () => {
    expect(scaleQuantity('', 4, 8)).toBe('')
    expect(scaleQuantity(null, 4, 8)).toBe('')
    expect(scaleQuantity(undefined, 4, 8)).toBe('')
    expect(scaleQuantity('2', 0, 4)).toBe('2')
    expect(scaleQuantity('2', 4, 0)).toBe('2')
    expect(scaleQuantity('2', -1, 4)).toBe('2')
  })

  it('correctly scales integer quantities', () => {
    expect(scaleQuantity('2', 2, 4)).toBe('4')
    expect(scaleQuantity('4', 4, 2)).toBe('2')
    expect(scaleQuantity('1', 2, 6)).toBe('3')
  })

  it('correctly scales simple fractions and cooking fractions', () => {
    expect(scaleQuantity('1/2', 2, 4)).toBe('1')
    expect(scaleQuantity('1/4', 2, 4)).toBe('1/2')
    expect(scaleQuantity('1/2', 4, 2)).toBe('1/4')
    expect(scaleQuantity('3/4', 2, 4)).toBe('1 1/2')
  })

  it('correctly scales mixed fractions', () => {
    expect(scaleQuantity('1 1/2', 2, 4)).toBe('3')
    expect(scaleQuantity('2 1/2', 2, 4)).toBe('5')
  })

  it('scales decimal numbers cleanly', () => {
    expect(scaleQuantity('1.5', 2, 4)).toBe('3')
    expect(scaleQuantity('0.5', 2, 4)).toBe('1')
  })

  it('preserves non-numeric text, pinch, to taste, and trailing notes', () => {
    expect(scaleQuantity('to taste', 2, 4)).toBe('to taste')
    expect(scaleQuantity('pinch', 2, 4)).toBe('pinch')
    expect(scaleQuantity('salt and pepper to taste', 2, 4)).toBe('salt and pepper to taste')
    expect(scaleQuantity('2 cloves', 2, 4)).toBe('4 cloves')
  })
})
