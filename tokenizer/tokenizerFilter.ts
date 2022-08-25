import { Tokenizer, Reader, Token, TokenName } from '../types'
import { eater, createToken } from './util'
import {
  isNotEquals,
  isContains,
  isStartWith,
  isEndWith,
  isEquals,
  isFilterEnd,
  isFilterSep,
} from './tokens'

export const Filters = {
  EQUALS: (obj: any | any[], left: any, right: string) => {
    const item = [].concat(obj[left])
    return Boolean(item.find((a) => String(a) === right))
  },
  NOT_EQUALS: (obj: any | any[], left: any, right: string) => {
    const item = [].concat(obj[left])
    return !item.find((a) => String(a) === right)
  },
  CONTAINS: (obj: any | any[], left: any, right: string) => {
    const item = [].concat(obj[left])
    return Boolean(item.find((a) => String(a).indexOf(right) !== -1))
  },
  STARTS_WITH: (obj: any | any[], left: any, right: string) => {
    const item = [].concat(obj[left])
    return Boolean(item.find((a) => String(a).startsWith(right)))
  },
  ENDS_WITH: (obj: any | any[], left: any, right: string) => {
    const item = [].concat(obj[left])
    return Boolean(item.find((a) => String(a).endsWith(right)))
  },
}

const operations = [isNotEquals, isContains, isStartWith, isEndWith, isEquals]

const tokenizerLeftOperand: Tokenizer = <T>(reader: Reader, token: Token<T>) => {
  const conditions = [...operations, isFilterEnd, isFilterSep]
  while (reader.read() && !conditions.some((o) => o(reader))) {
    reader.fragmentUpdate()
  }
  token.value = reader.fragment()
}

const tokenizerRightOperand: Tokenizer = <T>(reader: Reader, token: Token<T>) => {
  const conditions = [isFilterEnd, isFilterSep]
  while (reader.read() && !conditions.some((o) => o(reader))) {
    reader.fragmentUpdate()
  }
  token.value = reader.fragment()
}

const chooseExpression = <T>(reader: Reader, token: Token<T>): Token<T> => {
  if (isNotEquals(reader)) {
    reader.forward()
    return createToken(token, TokenName.NOT_EQUALS)
  } else if (isContains(reader)) {
    reader.forward()
    return createToken(token, TokenName.CONTAINS)
  } else if (isStartWith(reader)) {
    reader.forward()
    return createToken(token, TokenName.STARTS_WITH)
  } else if (isEndWith(reader)) {
    reader.forward()
    return createToken(token, TokenName.ENDS_WITH)
  } else if (isEquals(reader)) {
    return createToken(token, TokenName.EQUALS)
  }
  return createToken(token, TokenName.NOT_EMPTY)
}

export const tokenizerFilter: Tokenizer = <T>(reader: Reader, token: Token<T>) => {
  const eToken = createToken(token, TokenName.FILTER_EXPRESSION)
  const { swallow } = eater(reader, eToken)

  swallow(TokenName.LEFT_OPERAND, tokenizerLeftOperand)
  const fToken = chooseExpression(reader, eToken)

  if (isFilterSep(reader)) {
    tokenizerFilter(reader, token)
    reader.ignoreCurrentChar()
  } else if (!isFilterEnd(reader)) {
    swallow(TokenName.RIGHT_OPERAND, tokenizerRightOperand)
    if (isFilterSep(reader)) {
      tokenizerFilter(reader, token)
    }
    reader.ignoreCurrentChar()
  } else {
    reader.forward()
  }

  eToken.children.unshift(fToken)
  token.children.push(eToken)
}
