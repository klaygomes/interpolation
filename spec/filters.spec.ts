import { describe, expect, it } from 'vitest'
import { format } from '../src'

const data = {
  parts: [
    { kind: 'street', value: 'Main St', tags: ['primary', 'route'] },
    { kind: 'city', value: 'Stockholms län', tags: ['locality'] },
    { kind: 'zip', value: '116 45', tags: [] },
    { kind: 'a,b', value: 'comma', tags: [] },
    { kind: 'Zip', value: 'upper', flag: false },
  ],
  offset: 120,
}

describe('filters', () => {
  it.each([
    ['.parts[kind=street].value', 'Main St'],
    ['.parts[kind!=street].value', 'Stockholms län'],
    ['.parts[tags*=cal].value', 'Stockholms län'],
    ['.parts[tags~=cal].value', 'Stockholms län'],
    ['.parts[tags|=prim].value', 'Main St'],
    ['.parts[tags$=ute].value', 'Main St'],
    ['.parts[value=Stockholms län].kind', 'city'],
    ['.parts[kind=a\\,b].value', 'comma'],
    ['.parts[kind=ZIP].value', ''],
    ['.parts[kind=Zip].value', 'upper'],
    ['.parts[flag].value', 'upper'],
    ['.parts[ kind = zip ].value', ''],
    ['.parts[ kind =zip].value', '116 45'],
    ['.parts[kind=street, tags=route].value', 'Main St'],
    ['.parts[kind=street,tags=locality].value', ''],
  ])('selects the first match for %s', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it.each([
    ['.parts[*tags].kind', 'street, city, zip, a,b'],
    ['.parts[*kind!=street].value', 'Stockholms län, 116 45, comma, upper'],
    ['.parts[*kind=none].value', ''],
  ])('selects every match for %s', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })

  it('compares numbers as text', () => {
    expect(format('[offset=120]ok', data)).toBe('ok')
  })
})
