import { ReaderReadOnly } from '../types';

export const TOKENS = {
  FIELD: /\./,
  ESCAPE: /[^\\]/,
  SPACE: / /,
  GROUP: {
    START: /{/,
    END: /}/,
  },
  FILTER: {
    START: /\[/,
    END: /\]/,
    SEPARATION: /,/,
  },
  SPACESHIP: {
    START: /</,
    END: />/,
  },
};

export const TOKENS_COMPARISON = {
  EQUALS: /=/,
  NOT: /!/,
  CONTAINS: /[~*]/,
  STARTS_OR_IS: /\|/,
  ENDS_WITH: /\$/,
};

export const isEquals = (r: ReaderReadOnly): boolean =>
  TOKENS_COMPARISON.EQUALS.test(r.look());

export const isNotEquals = (r: ReaderReadOnly): boolean =>
  TOKENS_COMPARISON.NOT.test(r.look()) &&
  r.more() &&
  TOKENS_COMPARISON.EQUALS.test(r.lookAhead());

export const isContains = (r: ReaderReadOnly): boolean =>
  TOKENS_COMPARISON.CONTAINS.test(r.look()) &&
  r.more() &&
  TOKENS_COMPARISON.EQUALS.test(r.lookAhead());

export const isStartWith = (r: ReaderReadOnly): boolean =>
  TOKENS_COMPARISON.STARTS_OR_IS.test(r.look()) &&
  r.more() &&
  TOKENS_COMPARISON.EQUALS.test(r.lookAhead());

export const isEndWith = (r: ReaderReadOnly): boolean =>
  TOKENS_COMPARISON.ENDS_WITH.test(r.look()) &&
  r.more() &&
  TOKENS_COMPARISON.EQUALS.test(r.lookAhead());

export const isField = (r: ReaderReadOnly): boolean =>
  TOKENS.FIELD.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack()) &&
  r.more() &&
  !TOKENS.FIELD.test(r.lookAhead()) &&
  !TOKENS.SPACE.test(r.lookAhead()) &&
  !TOKENS.GROUP.START.test(r.lookAhead()) &&
  !TOKENS.GROUP.END.test(r.lookAhead()) &&
  !TOKENS.SPACESHIP.START.test(r.lookAhead()) &&
  !TOKENS.SPACESHIP.END.test(r.lookAhead());

export const isGroupStart = (r: ReaderReadOnly): boolean =>
  TOKENS.GROUP.START.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack()) &&
  r.more();

export const isGroupEnd = (r: ReaderReadOnly): boolean =>
  TOKENS.GROUP.END.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack());

export const isGroup = (r: ReaderReadOnly) => isGroupStart(r) || isGroupEnd(r);

export const isSpaceshipStart = (r: ReaderReadOnly): boolean =>
  TOKENS.SPACESHIP.START.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack()) &&
  r.more();

export const isSpaceshipEnd = (r: ReaderReadOnly): boolean =>
  TOKENS.SPACESHIP.END.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack());

export const isSpaceship = (r: ReaderReadOnly) => isSpaceshipStart(r) || isSpaceshipEnd(r);

export const isFilterStart = (r: ReaderReadOnly): boolean =>
  TOKENS.FILTER.START.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack());

export const isFilterEnd = (r: ReaderReadOnly): boolean =>
  TOKENS.FILTER.END.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack());

export const isFilterSep = (r: ReaderReadOnly) =>
  TOKENS.FILTER.SEPARATION.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack());

export const isFilter = (r: ReaderReadOnly) => isFilterStart(r) || isFilterEnd(r);

export const isSpacer = (r: ReaderReadOnly): boolean =>
  TOKENS.SPACE.test(r.look()) &&
  TOKENS.ESCAPE.test(r.lookBack());

export const isText = (r: ReaderReadOnly): boolean =>
  !isFilter(r) &&
  !isGroup(r) &&
  !isField(r) &&
  !isSpaceship(r) &&
  !isSpacer(r) &&
  Boolean(r.look());
