import { Tokenizer, Reader } from '../types'

export const tokenizerOr: Tokenizer = (reader: Reader) => {
  reader.read()
}
