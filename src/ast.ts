import type { ModifierName } from './modifiers'

export type Operator = '=' | '!=' | '*=' | '~=' | '|=' | '$='

export type Condition = {
  name: string
  operator?: Operator
  value?: string
}

export type FilterSegment = {
  type: 'filter'
  all: boolean
  conditions: Condition[]
}

export type FieldSegment = {
  type: 'field'
  name: string
  index: boolean
}

export type Segment = FieldSegment | FilterSegment

export type TextNode = {
  type: 'text'
  value: string
}

export type PathNode = {
  type: 'path'
  segments: Segment[]
  scope?: GroupNode
  modifiers: ModifierName[]
}

export type GroupNode = {
  type: 'group'
  guard?: FilterSegment
  body: Node[]
  modifiers: ModifierName[]
}

export type AltNode = {
  type: 'alt'
  options: Operand[]
}

export type Operand = TextNode | PathNode | GroupNode | AltNode

export type ChainNode = {
  type: 'chain'
  leading?: GroupNode
  operands: Operand[]
  separators: GroupNode[]
  trailing?: GroupNode
}

export type Node = Operand | ChainNode
