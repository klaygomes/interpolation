import { describe, expect, it } from 'vitest'
import { compile, InterpolationSyntaxError } from '../src'

const syntaxError = (template: string) => {
  try {
    compile(template)
  } catch (error) {
    if (error instanceof InterpolationSyntaxError) return error
    throw error
  }
  throw new Error(`expected ${JSON.stringify(template)} to be rejected`)
}

describe.skip('syntax errors', () => {
  it.each([
    ['.a<, >{.b<, >.c', 'unclosed group', 6],
    ['{a}}', "unexpected '}'", 3],
    ['.a[kind=x', 'unclosed filter', 2],
    ['.a[kind', 'unclosed filter', 2],
    ['a]', "unexpected ']'", 1],
    ['.a<, .b', 'unclosed separator', 2],
    ['{.a<, }', 'unclosed separator', 3],
    ['.a>', "unexpected '>'", 2],
    ['<, >', 'separator has no operand', 0],
    ['{<x>}', 'separator has no operand', 1],
    ['.a< 1 >< 2 >.b', 'separator has no operand', 7],
    ['.a|', 'fallback has no operand', 2],
    ['|.a', 'fallback has no operand', 0],
    ['.a[=x]', 'expected field name', 3],
    ['.a[*=x]', 'expected field name', 3],
    ['.a[]', 'expected field name', 3],
    ['.a[k==x]', "unknown operator '==' (did you mean '=')", 4],
    ['.a[k!==x]', "unknown operator '!==' (did you mean '!=')", 4],
    ['.a[k x]', "expected operator, ',' or ']'", 5],
    ['x [k]', 'a filter must follow a field or open a group', 2],
    ['abc\\', 'dangling escape', 3],
  ] as [string, string, number][])('rejects %s', (template, reason, offset) => {
    const error = syntaxError(template)
    expect({ reason: error.reason, offset: error.offset }).toEqual({ reason, offset })
  })

  it('points at the offending character', () => {
    expect(syntaxError('.a<, >{.b<, >.c').message).toBe('unclosed group at 6\n  .a<, >{.b<, >.c\n        ^')
  })

  it('is a SyntaxError', () => {
    expect(syntaxError('{')).toBeInstanceOf(SyntaxError)
  })
})
