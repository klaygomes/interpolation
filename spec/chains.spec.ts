import { describe, expect, it } from 'vitest'
import { format } from '../src'

const template = '.street< >.number<, >.city'

describe('chains', () => {
  it.each([
    [{ street: 'Main', number: 22, city: 'Sthlm' }, 'Main 22, Sthlm'],
    [{ street: 'Main', city: 'Sthlm' }, 'Main, Sthlm'],
    [{ number: 22, city: 'Sthlm' }, '22, Sthlm'],
    [{ street: 'Main', number: 22 }, 'Main 22'],
    [{ city: 'Sthlm' }, 'Sthlm'],
    [{}, ''],
  ])('joins %o with the separator before each surviving operand', (data, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it.each([
    ['.a <, > .b', { a: 'A', b: 'B' }, 'A, B'],
    ['.a <, > .b tail', { a: 'A', b: 'B' }, 'A, B tail'],
    ['.a<, >.b .c', { a: 'A', b: 'B', c: 'C' }, 'A, B C'],
    ['x<, >.a', { a: 'A' }, 'x, A'],
    ['x<, >.a .b', { b: 'B' }, 'x B'],
    ['{x}<, >.a', { a: 'A' }, 'x, A'],
  ])('treats whitespace and literals in %s', (fmt, data, expected) => {
    expect(format(fmt, data)).toBe(expected)
  })

  it.each([
    ['<Tel: >.phone', { phone: '555' }, 'Tel: 555'],
    ['<Tel: >.phone', {}, ''],
    ['.price< kr>', { price: 10 }, '10 kr'],
    ['.price< kr>', {}, ''],
    ['<(>.a<, >.b<)>', { b: 'B' }, '(B)'],
  ])('prints edge separators in %s only next to content', (fmt, data, expected) => {
    expect(format(fmt, data)).toBe(expected)
  })

  it('evaluates fields inside separators', () => {
    expect(format('.a< .sep >.b', { a: 'A', b: 'B', sep: '&' })).toBe('A & B')
  })
})
