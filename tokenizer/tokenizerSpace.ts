import { Tokenizer, Reader } from '../types';

export const tokenizerSpace: Tokenizer = (reader: Reader) => {
  reader.read();
};
