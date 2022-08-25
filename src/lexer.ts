import type { Operator } from './ast'
import { InterpolationSyntaxError } from './errors'
import { isModifierName, type ModifierName } from './modifiers'

type Punctuation = '{' | '}' | '<' | '>' | '|' | ',' | ']' | 'eof'
type Literal = 'text' | 'space' | 'name' | 'value'

export type Token = { offset: number } & (
  | { [K in Literal]: { type: K; value: string } }[Literal]
  | { [K in Punctuation]: { type: K } }[Punctuation]
  | { type: 'field'; name: string; index: boolean }
  | { type: 'modifier'; name: ModifierName }
  | { type: 'operator'; value: Operator }
  | { type: 'filter'; all: boolean }
)

const PUNCTUATION = new Set(['{', '}', '<', '>', '|'])
const OPERATORS: readonly Operator[] = ['!=', '*=', '~=', '|=', '$=', '=']
const MODIFIER_HOSTS = new Set<Token['type']>(['field', '}', ']', 'modifier'])

const isNameChar = (char: string | undefined) => char !== undefined && /[\p{L}\p{N}_$]/u.test(char)
const isSpace = (char: string | undefined) => char !== undefined && /\s/u.test(char)
const isDigit = (char: string | undefined) => char !== undefined && /[0-9]/.test(char)

export const lex = (format: string): Token[] => {
  const tokens: Token[] = []
  let pos = 0
  let text = ''
  let textOffset = 0

  const fail = (reason: string, offset: number): never => {
    throw new InterpolationSyntaxError(reason, format, offset)
  }

  const escaped = () => {
    if (pos + 1 >= format.length) fail('dangling escape', pos)
    pos += 2
    return format[pos - 1] as string
  }

  const appendText = (chunk: string, offset: number) => {
    if (text === '') textOffset = offset
    text += chunk
  }

  const flushText = () => {
    if (text !== '') tokens.push({ type: 'text', value: text, offset: textOffset })
    text = ''
  }

  const isJoiningEscape = (at: number) => format[at] === '\\' && isNameChar(format[at + 2])

  const readName = () => {
    let name = ''
    let wasEscaped = false
    while (pos < format.length) {
      const char = format[pos]
      if (isJoiningEscape(pos)) {
        name += escaped()
        wasEscaped = true
      } else if (isNameChar(char) && !(char === '$' && format[pos + 1] === '=')) {
        name += char
        pos += 1
      } else {
        break
      }
    }
    return { name, wasEscaped }
  }

  const isFieldStart = (at: number) => {
    const char = format[at]
    if (char === '\\') return isJoiningEscape(at)
    if (char === '-') return isDigit(format[at + 1])
    return isNameChar(char)
  }

  const lexField = () => {
    const offset = pos
    pos += 1
    if (format[pos] === '-') {
      pos += 1
      const { name } = readName()
      tokens.push({ type: 'field', name: `-${name}`, index: /^\d+$/.test(name), offset })
      return
    }
    const { name, wasEscaped } = readName()
    tokens.push({ type: 'field', name, index: !wasEscaped && /^\d+$/.test(name), offset })
  }

  const lexModifier = () => {
    const previous = tokens.at(-1)
    if (text !== '' || !previous || !MODIFIER_HOSTS.has(previous.type)) return false
    let end = pos + 1
    while (isNameChar(format[end])) end += 1
    const name = format.slice(pos + 1, end)
    if (!isModifierName(name)) return false
    tokens.push({ type: 'modifier', name, offset: pos })
    pos = end
    return true
  }

  const skipSpaces = () => {
    while (isSpace(format[pos])) pos += 1
  }

  const readOperator = () => {
    const operator = OPERATORS.find((candidate) => format.startsWith(candidate, pos))
    if (!operator) return undefined
    if (format[pos + operator.length] === '=') {
      fail(`unknown operator '${operator}=' (did you mean '${operator}')`, pos)
    }
    tokens.push({ type: 'operator', value: operator, offset: pos })
    pos += operator.length
    return operator
  }

  const readValue = (filterOffset: number) => {
    const offset = pos
    let value = ''
    while (format[pos] !== ',' && format[pos] !== ']') {
      if (pos >= format.length) fail('unclosed filter', filterOffset)
      if (format[pos] === '\\') {
        value += escaped()
      } else {
        value += format[pos]
        pos += 1
      }
    }
    tokens.push({ type: 'value', value, offset })
  }

  const lexFilter = () => {
    const filterOffset = pos
    pos += 1
    const all = format[pos] === '*' && format[pos + 1] !== '='
    if (all) pos += 1
    tokens.push({ type: 'filter', all, offset: filterOffset })

    for (;;) {
      skipSpaces()
      const nameOffset = pos
      tokens.push({ type: 'name', value: readName().name, offset: nameOffset })
      skipSpaces()
      if (readOperator()) readValue(filterOffset)

      const char = format[pos]
      if (char === undefined) fail('unclosed filter', filterOffset)
      if (char !== ',' && char !== ']') fail("expected operator, ',' or ']'", pos)
      tokens.push({ type: char as ',' | ']', offset: pos })
      pos += 1
      if (char === ']') return
    }
  }

  while (pos < format.length) {
    const char = format[pos] as string

    if (char === '\\') {
      const offset = pos
      appendText(escaped(), offset)
    } else if (isSpace(char)) {
      flushText()
      const offset = pos
      while (isSpace(format[pos])) pos += 1
      tokens.push({ type: 'space', value: format.slice(offset, pos), offset })
    } else if (PUNCTUATION.has(char)) {
      flushText()
      tokens.push({ type: char as '{' | '}' | '<' | '>' | '|', offset: pos })
      pos += 1
    } else if (char === '[') {
      flushText()
      lexFilter()
    } else if (char === ']') {
      fail("unexpected ']'", pos)
    } else if (char === '.' && isFieldStart(pos + 1)) {
      flushText()
      lexField()
    } else if (char === ':' && lexModifier()) {
      continue
    } else {
      appendText(char, pos)
      pos += 1
    }
  }

  flushText()
  tokens.push({ type: 'eof', offset: format.length })
  return tokens
}
