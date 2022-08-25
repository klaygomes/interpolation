import { describe, expect, it } from 'vitest'
import { format } from '../src'

const data = {
  phone: '555',
  email: 'a@b',
  offset: 120,
  hood: 'Södermalm',
  name: 'Fotografiska',
  parts: [
    { kind: 'country', long: 'Sweden', short: 'SE' },
    { kind: 'city', long: 'Stockholm', short: 'Sthlm' },
  ],
}

describe('groups', () => {
  it.each([
    ['{Tel: .phone}<, >.email', data, 'Tel: 555, a@b'],
    ['{Tel: .phone}<, >.email', { email: 'a@b' }, 'a@b'],
    ['{N/A}<, >.x', { x: 'X' }, 'N/A, X'],
    ['{N/A}<, >.x', {}, 'N/A'],
    ['{}<, >.x', { x: 'X' }, 'X'],
    ['hello .missing', {}, ''],
    ['hello', {}, 'hello'],
  ])('treats literals as decoration in %s', (fmt, input, expected) => {
    expect(format(fmt, input)).toBe(expected)
  })

  it.each([
    ['.parts[kind=country]{we live in .long, code .short}', 'we live in Sweden, code SE'],
    ['.parts[kind=moon]{we live in .long}', ''],
    ['.parts[*kind]{.long (.short)}', 'Sweden (SE), Stockholm (Sthlm)'],
    ['.parts.0{.long}', 'Sweden'],
  ])('scopes a group to a path in %s', (fmt, expected) => {
    expect(format(fmt, data)).toBe(expected)
  })

  it.each([
    ['{[offset=120]near .hood}<, >.name', 'near Södermalm, Fotografiska'],
    ['{[offset=999]near .hood}<, >.name', 'Fotografiska'],
    ['{[offset]only literals}', 'only literals'],
    ['[offset=999]root guard', ''],
  ])('guards a group with %s', (fmt, expected) => {
    expect(format(fmt, data)).toBe(expected)
  })
})
