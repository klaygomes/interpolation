import { Reader, Token, TokenName, Rule } from '../types';
import { isField, isGroupStart, isSpacer, isText, isFilterStart, isSpaceshipStart } from './tokens';
import { eater } from './util';

import { tokenizerText } from './tokenizerText';
import { tokenizerField } from './tokenizerField';
import { tokenizerGroup } from './tokenizerGroup';
import { tokenizerFilter } from './tokenizerFilter';
import { tokenizerSpace } from './tokenizerSpace';
import { tokenizerSpaceship } from './tokenizerSpaceship';

export const tokenizer = <T>(reader: Reader, root?: Token<T>): Token<T> => {
  let givenRoot = root;
  if (!givenRoot) {
    givenRoot = {
      token: TokenName.ROOT,
      children: [],
    };
  }
  const { digest } = eater(reader, givenRoot);
  while (reader.read()) {
    const rules: Rule[] = [
      [isFilterStart, TokenName.FILTER, tokenizerFilter],
      [isField, TokenName.FIELD, tokenizerField],
      [isGroupStart, TokenName.GROUP, tokenizerGroup],
      [isSpaceshipStart, TokenName.SPACESHIP, tokenizerSpaceship],
      [isSpacer, TokenName.SPACE, tokenizerSpace],
      [isText, TokenName.TEXT, tokenizerText],
    ];
    digest(rules);
  }
  return givenRoot;
};

