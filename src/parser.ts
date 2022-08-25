import type { ChainNode, Condition, FilterSegment, GroupNode, Node, Operand, PathNode, Segment } from './ast'
import { InterpolationSyntaxError } from './errors'
import { lex, type Token } from './lexer'
import type { ModifierName } from './modifiers'

type Piece =
  | { kind: 'operand'; node: Operand }
  | { kind: 'space'; value: string }
  | { kind: 'separator'; group: GroupNode; offset: number }
  | { kind: 'pipe'; offset: number }

type Closer = '}' | '>' | 'eof'

const CLOSER_NAMES: Record<Closer, string> = { '}': 'group', '>': 'separator', eof: 'format' }

export const parse = (format: string): GroupNode => {
  const tokens = lex(format)
  let cursor = 0

  const fail = (reason: string, offset: number): never => {
    throw new InterpolationSyntaxError(reason, format, offset)
  }

  const peek = () => tokens[cursor] as Token
  const next = () => tokens[cursor++] as Token
  const expect = <T extends Token['type']>(type: T) => {
    const token = next()
    if (token.type !== type) fail(`expected '${type}'`, token.offset)
    return token as Extract<Token, { type: T }>
  }

  const parseModifiers = () => {
    const modifiers: ModifierName[] = []
    for (let token = peek(); token.type === 'modifier'; token = peek()) {
      modifiers.push(token.name)
      next()
    }
    return modifiers
  }

  const parseFilter = (): FilterSegment => {
    const { all } = expect('filter')
    const conditions: Condition[] = []
    for (;;) {
      const name = expect('name')
      if (name.value === '') fail('expected field name', name.offset)
      const condition: Condition = { name: name.value }
      if (peek().type === 'operator') {
        condition.operator = expect('operator').value
        condition.value = expect('value').value
      }
      conditions.push(condition)
      if (next().type === ']') return { type: 'filter', all, conditions }
    }
  }

  const parseGroup = (): GroupNode => {
    const open = expect('{')
    const group = parseSequence('}', open.offset)
    group.modifiers = parseModifiers()
    return group
  }

  const parsePath = (): PathNode => {
    const segments: Segment[] = []
    for (let token = peek(); token.type === 'field' || token.type === 'filter'; token = peek()) {
      if (token.type === 'filter') {
        segments.push(parseFilter())
      } else {
        segments.push({ type: 'field', name: token.name, index: token.index })
        next()
      }
    }
    const path: PathNode = { type: 'path', segments, modifiers: [] }
    if (peek().type === '{') path.scope = parseGroup()
    path.modifiers = parseModifiers()
    return path
  }

  const parsePiece = (token: Token): Piece => {
    switch (token.type) {
      case 'text':
        next()
        return { kind: 'operand', node: { type: 'text', value: token.value } }
      case 'space':
        next()
        return { kind: 'space', value: token.value }
      case 'field':
        return { kind: 'operand', node: parsePath() }
      case '{':
        return { kind: 'operand', node: parseGroup() }
      case '<':
        next()
        return { kind: 'separator', group: parseSequence('>', token.offset), offset: token.offset }
      case '|':
        next()
        return { kind: 'pipe', offset: token.offset }
      case 'filter':
        return fail('a filter must follow a field or open a group', token.offset)
      case 'modifier':
        return fail('a modifier must follow a field or a group', token.offset)
      default:
        return fail(`unexpected '${token.type}'`, token.offset)
    }
  }

  const parseSequence = (closer: Closer, openOffset: number): GroupNode => {
    const group: GroupNode = { type: 'group', body: [], modifiers: [] }
    if (peek().type === 'filter') group.guard = parseFilter()

    const pieces: Piece[] = []
    for (let token = peek(); token.type !== closer; token = peek()) {
      if (token.type === 'eof') fail(`unclosed ${CLOSER_NAMES[closer]}`, openOffset)
      if (token.type === '}' || token.type === '>') {
        if (closer === 'eof') fail(`unexpected '${token.type}'`, token.offset)
        fail(`unclosed ${CLOSER_NAMES[closer]}`, openOffset)
      }
      pieces.push(parsePiece(token))
    }
    next()

    group.body = buildChains(buildAlternatives(dropSpacesAroundOperators(pieces)))
    return group
  }

  const dropSpacesAroundOperators = (pieces: Piece[]) => {
    const isOperator = (piece: Piece | undefined) => piece?.kind === 'separator' || piece?.kind === 'pipe'
    return pieces.filter(
      (piece, i) => piece.kind !== 'space' || !(isOperator(pieces[i - 1]) || isOperator(pieces[i + 1])),
    )
  }

  const buildAlternatives = (pieces: Piece[]) => {
    const result: Piece[] = []
    for (let i = 0; i < pieces.length; i += 1) {
      const piece = pieces[i] as Piece
      if (piece.kind !== 'pipe') {
        result.push(piece)
        continue
      }
      const left = result.pop()
      const right = pieces[i + 1]
      if (left?.kind !== 'operand' || right?.kind !== 'operand') {
        return fail('fallback has no operand', piece.offset)
      }
      const options = left.node.type === 'alt' ? left.node.options : [left.node]
      result.push({ kind: 'operand', node: { type: 'alt', options: [...options, right.node] } })
      i += 1
    }
    return result
  }

  const buildChains = (pieces: Piece[]): Node[] => {
    const nodes: Node[] = []
    let i = 0
    const at = (index: number) => pieces[index]

    while (i < pieces.length) {
      const piece = at(i) as Piece
      const startsChain = piece.kind === 'separator' || (piece.kind === 'operand' && at(i + 1)?.kind === 'separator')
      if (!startsChain) {
        nodes.push(piece.kind === 'space' ? { type: 'text', value: piece.value } : (piece as { node: Operand }).node)
        i += 1
        continue
      }

      const chain: ChainNode = { type: 'chain', operands: [], separators: [] }
      if (piece.kind === 'separator') {
        const first = at(i + 1)
        if (first?.kind !== 'operand') fail('separator has no operand', piece.offset)
        chain.leading = piece.group
        i += 1
      }
      chain.operands.push((at(i) as { node: Operand }).node)
      i += 1

      for (let separator = at(i); separator?.kind === 'separator'; separator = at(i)) {
        const following = at(i + 1)
        if (following?.kind === 'separator') fail('separator has no operand', following.offset)
        i += 1
        if (following?.kind !== 'operand') {
          chain.trailing = separator.group
          break
        }
        chain.separators.push(separator.group)
        chain.operands.push(following.node)
        i += 1
      }
      nodes.push(chain)
    }
    return nodes
  }

  return parseSequence('eof', 0)
}
