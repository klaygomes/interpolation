import { describe, expect, it } from 'vitest'
import { format } from '../src'

const data = { city: 'stockholm city', loud: 'LOUD', pad: '  x  ', street: 'main', number: 22 }

describe('modifiers', () => {
  it.each([
    ['.city:upper', 'STOCKHOLM CITY'],
    ['.loud:lower', 'loud'],
    ['.city:title', 'Stockholm City'],
    ['.pad:trim', 'x'],
    ['{.street .number}:title', 'Main 22'],
    ['.city:trim:upper', 'STOCKHOLM CITY'],
    ['.city: hello', 'stockholm city: hello'],
    ['.city:uppercase', 'stockholm city:uppercase'],
    ['Note:upper', 'Note:upper'],
  ])('applies %s', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it('treats a group trimmed to nothing as empty', () => {
    expect(format('{ }:trim<, >.street', data)).toBe('main')
  })
})
