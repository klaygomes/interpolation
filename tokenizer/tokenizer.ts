import { Reader, Token, TokenName, Rule } from '../types';
import { isField, isGroupStart, isSpacer, isText, isFilterStart, isSpaceshipStart, isOR } from './tokens';
import { eater } from './util';

import { tokenizerText } from './tokenizerText';
import { tokenizerField } from './tokenizerField';
import { tokenizerGroup } from './tokenizerGroup';
import { tokenizerFilter } from './tokenizerFilter';
import { tokenizerSpace } from './tokenizerSpace';
import { tokenizerSpaceship } from './tokenizerSpaceship';
import { tokenizerOr } from './tokenizerOr';

export const tokenizer = (reader: Reader, root?: Token): Token => {
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
      [isOR, TokenName.OR, tokenizerOr],
    ];
    digest(rules);
  }
  return givenRoot;
};

