import { Tokenizer, Reader, Token, TokenName, Rule } from '../types'

export const createToken = <T>(parent: Token<T>, name: TokenName): Token<T> => ({
  token: name,
  parent,
  children: [],
})

export const eater = <T>(reader: Reader, token: Token<T>) => {
  const swallow = (tokenName: TokenName, tokenizer: Tokenizer) => {
    const fragment = reader.fragment()
    reader.fragmentClear()
    const tGroup = createToken<T>(token, tokenName)
    token.children.push(tGroup)
    tokenizer(reader, tGroup)
    reader.fragment(fragment)
  }
  const digest = (rules: Rule[]) => {
    const match = () => rules.some(([predicate]) => predicate(reader))
    while (match()) {
      rules.forEach(([predicate, name, tokenizer]) => {
        if (predicate(reader)) {
          swallow(name, tokenizer)
        }
      })
    }
  }

  return {
    swallow,
    digest,
  }
}
