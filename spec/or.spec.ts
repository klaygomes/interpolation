import { describe, expect, it } from 'vitest'
import { format } from '../src'

describe('fallbacks', () => {
  it.each([
    ['.nick|.first', { nick: 'Al', first: 'Alan' }, 'Al'],
    ['.nick|.first', { first: 'Alan' }, 'Alan'],
    ['.a|.b|Unknown', {}, 'Unknown'],
    ['.a | .b', { b: 'B' }, 'B'],
    ['.nick | .first<, >.city', { first: 'Ann', city: 'Sthlm' }, 'Ann, Sthlm'],
    ['.nick|.first<, >.city', { city: 'Sthlm' }, 'Sthlm'],
    ['{.a<, >.b}|.c', { b: 'B', c: 'C' }, 'B'],
    ['Foo \\| Bar', {}, 'Foo | Bar'],
    ['.a|.b', {}, ''],
  ])('resolves %s', (fmt, data, expected) => {
    expect(format(fmt, data)).toBe(expected)
  })
})
