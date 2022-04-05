import { Tokenizer, Reader, Token, TokenName, Rule } from '../types';
import { eater } from './util';
import { isFilterStart, isField, isSpacer, isGroupEnd, isSpaceship } from './tokens';

import { tokenizerFilter } from './tokenizerFilter';

export const tokenizerField: Tokenizer = <T>(reader: Reader, token: Token<T>) => {
  const { digest } = eater(reader, token);
  while (reader.read()) {
    const rules: Rule[] = [
      [isFilterStart, TokenName.FILTER, tokenizerFilter],
      [isField, TokenName.FIELD, tokenizerField],
    ];

    digest(rules);
    if (isSpacer(reader) || isGroupEnd(reader) || isSpaceship(reader)) {
      break;
    }
    reader.fragmentUpdate();
  }
  token.value = reader.fragment();
};
