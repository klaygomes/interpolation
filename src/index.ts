import { evaluate } from './evaluate'
import { parse } from './parser'

export type {
  AltNode,
  ChainNode,
  Condition,
  FieldSegment,
  FilterSegment,
  GroupNode,
  Node,
  Operand,
  Operator,
  PathNode,
  Segment,
  TextNode,
} from './ast'
export { InterpolationSyntaxError } from './errors'
export { MODIFIERS, type ModifierName } from './modifiers'
export { parse }

export type Formatter = (data: unknown) => string

export const compile = (template: string): Formatter => {
  const ast = parse(template)
  return (data) => evaluate(ast, data)
}

export const format = (template: string, data: unknown) => compile(template)(data)
