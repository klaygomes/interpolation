import { reader } from './reader';

export type Reader = ReturnType<typeof reader>;
export type ReaderReadOnly = Pick<Reader, 'look' | 'lookAhead' | 'lookBack' | 'more'>;

export type ILCode = {
  text?: string;
  raw?: any;
  ignore?: boolean;
};

export type ILToken = (index: number, array: ILToken[]) => ILCode;

export type TContext = Record<string, unknown>;
export type TGrammar = {
  [key in TokenName]: <T>(obj: TContext, token: Token<T>) => void
};


export enum TokenName {
  GROUP = 'GROUP',
  FILTER = 'FILTER',
  FIELD = 'FIELD',
  SPACE = 'SPACE',
  RIGHT_OPERAND = 'RIGHT_OPERAND',
  NOT_EQUALS = 'NOT_EQUALS',
  LEFT_OPERAND = 'LEFT_OPERAND',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  EQUALS = 'EQUALS',
  TEXT = 'TEXT',
  ROOT = 'ROOT',
  FILTER_EXPRESSION = 'FILTER_EXPRESSION',
  NOT_EMPTY = 'NOT_EMPTY',
  SPACESHIP = 'SPACESHIP',
  OR = 'OR',
}

export type Token = {
  token: TokenName,
  value?: string,
  parent?: Token,
  children: Token[],
  ignore?: boolean,
  context?: TContext
};

export type Tokenizer = (reader: Reader, token: Token) => void;

export type Rule = [(r: ReaderReadOnly) => boolean, TokenName, Tokenizer];

