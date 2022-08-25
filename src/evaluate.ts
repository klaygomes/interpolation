import type { AltNode, ChainNode, GroupNode, Node, PathNode } from './ast'
import { applyModifiers } from './modifiers'
import { passesGuard, resolve, toText } from './values'

type Result = { text: string; fields: number; filled: number }

const EMPTY: Result = { text: '', fields: 0, filled: 0 }

const isEmpty = (result: Result) => result.text === '' || (result.fields > 0 && result.filled === 0)

const concat = (results: readonly Result[]): Result =>
  results.reduce(
    (total, result) => ({
      text: total.text + result.text,
      fields: total.fields + result.fields,
      filled: total.filled + result.filled,
    }),
    EMPTY,
  )

const fieldResult = (text: string): Result => ({ text, fields: 1, filled: text === '' ? 0 : 1 })

const evaluateGroup = (group: GroupNode, scope: unknown): Result => {
  if (group.guard && !passesGuard(scope, group.guard)) return { text: '', fields: 1, filled: 0 }
  const result = concat(group.body.map((node) => evaluateNode(node, scope)))
  if (isEmpty(result)) return { ...result, text: '' }
  const text = applyModifiers(result.text, group.modifiers)
  return { ...result, text, filled: text === '' ? 0 : result.filled }
}

const evaluateScoped = (value: unknown, group: GroupNode) => {
  const items = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]
  return items
    .map((item) => evaluateGroup(group, item))
    .filter((result) => !isEmpty(result))
    .map((result) => result.text)
    .join(', ')
}

const evaluatePath = (path: PathNode, scope: unknown): Result => {
  const value = resolve(scope, path.segments)
  const text = path.scope ? evaluateScoped(value, path.scope) : toText(value)
  return fieldResult(applyModifiers(text, path.modifiers))
}

const evaluateAlt = (alt: AltNode, scope: unknown): Result => {
  const results = alt.options.map((option) => evaluateNode(option, scope))
  return results.find((result) => !isEmpty(result)) ?? { ...concat(results), text: '', filled: 0 }
}

const evaluateChain = (chain: ChainNode, scope: unknown): Result => {
  const results = chain.operands.map((operand) => evaluateNode(operand, scope))
  const survivors = results.flatMap((result, i) => (isEmpty(result) ? [] : [{ result, i }]))
  if (survivors.length === 0) return { ...concat(results), text: '', filled: 0 }

  const separatorBefore = (i: number) => {
    const separator = chain.separators[i - 1]
    return separator ? evaluateGroup(separator, scope).text : ''
  }
  const body = survivors.map(({ result, i }, position) => (position === 0 ? '' : separatorBefore(i)) + result.text)
  const leading = chain.leading ? evaluateGroup(chain.leading, scope).text : ''
  const trailing = chain.trailing ? evaluateGroup(chain.trailing, scope).text : ''
  return { ...concat(survivors.map(({ result }) => result)), text: leading + body.join('') + trailing }
}

const evaluateNode = (node: Node, scope: unknown): Result => {
  switch (node.type) {
    case 'text':
      return { text: node.value, fields: 0, filled: 0 }
    case 'path':
      return evaluatePath(node, scope)
    case 'group':
      return evaluateGroup(node, scope)
    case 'alt':
      return evaluateAlt(node, scope)
    case 'chain':
      return evaluateChain(node, scope)
  }
}

export const evaluate = (root: GroupNode, data: unknown) => evaluateGroup(root, data).text
