import { Tokenizer, Reader, Token } from '../types';
import { isText } from './tokens';

export const tokenizerText: Tokenizer = (reader: Reader, token: Token) => {
  do {
    reader.fragmentUpdate();
  } while (reader.read() && isText(reader));
  token.value = reader.fragment();
};
