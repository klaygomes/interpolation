import { isGroupEnd, isGroupStart } from './tokens';
import { Tokenizer, Token, Reader } from '../types';
import { tokenizer } from './tokenizer';


export const tokenizerGroup: Tokenizer = <T>(reader: Reader, token: Token<T>) => {
  tokenizer(reader, token);
};
