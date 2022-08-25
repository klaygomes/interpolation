import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { compile, InterpolationSyntaxError } from '../src'

const alphabet = ['.', 'a', 'b', '0', '-', ' ', '{', '}', '<', '>', '[', ']', '*', '=', '!', '|', '$', '~', ',', '\\', ':', 'upper', 'é']
const template = fc.array(fc.constantFrom(...alphabet), { maxLength: 30 }).map((parts) => parts.join(''))

const json = fc.letrec((tie) => ({
  value: fc.oneof(
    { maxDepth: 3 },
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.array(tie('value'), { maxLength: 3 }),
    fc.dictionary(fc.constantFrom('a', 'b', '0'), tie('value'), { maxKeys: 3 }),
  ),
})).value

describe('fuzz', () => {
  it('only ever throws InterpolationSyntaxError while parsing', () => {
    fc.assert(
      fc.property(template, (input) => {
        try {
          compile(input)
        } catch (error) {
          expect(error).toBeInstanceOf(InterpolationSyntaxError)
        }
      }),
      { numRuns: 2000 },
    )
  })

  it('never throws while evaluating', () => {
    fc.assert(
      fc.property(template, json, (input, data) => {
        let formatter: ((data: unknown) => string) | undefined
        try {
          formatter = compile(input)
        } catch {
          return
        }
        expect(typeof formatter(data)).toBe('string')
      }),
      { numRuns: 2000 },
    )
  })
})
