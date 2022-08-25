import { describe, expect, it } from 'vitest'
import { format } from '../src'

const data = { a: 'A', 'first-name': 'Jo' }

describe.skip('escapes', () => {
  it.each([
    ['\\.not_a_field', '.not_a_field'],
    ['\\{\\.a\\}', '{.a}'],
    ['\\<.a\\>', '<A>'],
    ['\\[x\\]', '[x]'],
    ['C:\\\\path', 'C:\\path'],
    ['.first\\-name', 'Jo'],
    ['mail@x\\.com', 'mail@x.com'],
    ['\\z', 'z'],
  ])('reads %s', (template, expected) => {
    expect(format(template, data)).toBe(expected)
  })
})
