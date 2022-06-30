import { Tokenizer, Token, Reader, TokenName, Rule } from '../types';
import { isFilterStart, isField, isGroupStart, isText, isSpacer, isOR, isSpaceshipEnd, isSpaceshipStart } from './tokens';
import { eater } from './util';
import { tokenizerText } from './tokenizerText';
import { tokenizerField } from './tokenizerField';
import { tokenizerGroup } from './tokenizerGroup';
import { tokenizerFilter } from './tokenizerFilter';
import { tokenizerSpace } from './tokenizerSpace';
import { tokenizerOr } from './tokenizerOr';

export const tokenizerSpaceship: Tokenizer = <T>(reader: Reader, token: Token<T>) => {
  const { digest } = eater(reader, token);
  while (reader.read()) {
    const rules: Rule[] = [
      [isFilterStart, TokenName.FILTER, tokenizerFilter],
      [isField, TokenName.FIELD, tokenizerField],
      [isGroupStart, TokenName.GROUP, tokenizerGroup],
      [isSpaceshipStart, TokenName.SPACESHIP, tokenizerSpaceship],
      [isSpacer, TokenName.SPACE, tokenizerSpace],
      [isText, TokenName.TEXT, tokenizerText],
      [isOR, TokenName.OR, tokenizerOr],
    ];
    digest(rules);
    if (isSpaceshipEnd(reader)) {
      break;
    }
  }
};
