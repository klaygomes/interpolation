import { Tokenizer, Reader, Token } from '../types';
import { isText } from './tokens';

export const tokenizerText: Tokenizer = <T>(reader: Reader, token: Token<T>) => {
  do {
    reader.fragmentUpdate();
  } while (reader.read() && isText(reader));
  token.value = reader.fragment();
};
