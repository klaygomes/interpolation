import { Tokenizer, Token, Reader, TokenName, Rule } from '../types'
import {
  isFilterStart,
  isField,
  isGroupStart,
  isText,
  isSpacer,
  isGroupEnd,
  isSpaceshipStart,
} from './tokens'
import { eater } from './util'
import { tokenizerText } from './tokenizerText'
import { tokenizerField } from './tokenizerField'
import { tokenizerSpaceship } from './tokenizerSpaceship'
import { tokenizerFilter } from './tokenizerFilter'
import { tokenizerSpace } from './tokenizerSpace'

export const tokenizerGroup: Tokenizer = (reader: Reader, token: Token) => {
  const { digest } = eater(reader, token)
  while (reader.read()) {
    const rules: Rule[] = [
      [isFilterStart, TokenName.FILTER, tokenizerFilter],
      [isField, TokenName.FIELD, tokenizerField],
      [isGroupStart, TokenName.GROUP, tokenizerGroup],
      [isSpaceshipStart, TokenName.SPACESHIP, tokenizerSpaceship],
      [isSpacer, TokenName.SPACE, tokenizerSpace],
      [isText, TokenName.TEXT, tokenizerText],
    ]
    digest(rules)
    if (isGroupEnd(reader)) {
      break
    }
  }
}
