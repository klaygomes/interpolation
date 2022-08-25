import { describe, expect, it } from 'vitest'
import { format } from '../src'

const data = {
  city: 'Stockholm',
  country: 'Sweden',
  zero: 0,
  no: false,
  blank: '   ',
  empty: '',
  nothing: null,
  nan: Number.NaN,
  big: 10n,
  object: { nested: { deep: 'yes' } },
  tags: ['a', '', 'b', 3, null, ['c']],
  people: [
    { name: 'Ann', pets: ['cat'] },
    { name: 'Bo', pets: ['dog', 'fish'] },
    { pets: [] },
  ],
  'first-name': 'Jo',
  'odd key': 'spaced',
  42: 'numeric key',
}

describe.skip('fields', () => {
  it.each([
    ['.city', 'Stockholm'],
    ['.city, .country', 'Stockholm, Sweden'],
    ['.city-.country', 'Stockholm-Sweden'],
    ['.city.', 'Stockholm.'],
    ['in .city!', 'in Stockholm!'],
    ['.object.nested.deep', 'yes'],
    ['.missing.deep', ''],
    ['.city.length', ''],
    ['.constructor', ''],
    ['.__proto__', ''],
  ])('reads %s', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it.each([
    ['.zero', '0'],
    ['.no', 'false'],
    ['.big', '10'],
    ['.blank', ''],
    ['.empty', ''],
    ['.nothing', ''],
    ['.nan', ''],
    ['.object', ''],
    ['.tags', 'a, b, 3, c'],
  ])('converts %s to text', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it.each([
    ['.first\\-name', 'Jo'],
    ['.odd\\ key', 'spaced'],
    ['.42', 'numeric key'],
  ])('reads the escaped or numeric key %s', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it.each([
    ['.people.0.name', 'Ann'],
    ['.people.-2.name', 'Bo'],
    ['.people.9.name', ''],
    ['.people.name', 'Ann, Bo'],
    ['.people.pets', 'cat, dog, fish'],
    ['.people.pets.1', 'dog'],
  ])('walks arrays with %s', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it.each([undefined, null, 'text', 42, []])('treats %s data as empty', (input) => {
    expect(format('.city', input)).toBe('')
  })
})
