import { Token, TokenName, ILToken, ILCode, TGrammar, TContext } from './types';
import { group } from './il';
import { Filters } from './tokenizer/tokenizerFilter';

export const parser = (obj: TContext, token: Token) => {
  const il: ILToken[] = [];
  const grammar: TGrammar = {
    [TokenName.FIELD]: (scope, currentToken) => {
      const nextScope = scope[currentToken.value!] as TContext;
      if (nextScope) {
        if (!currentToken.children.length) {
          il.push(() => ({
            raw: nextScope,
            text: String(nextScope),
            ignore: String(nextScope).trim() === '',
          }));
        }
        currentToken.context = nextScope;
        currentToken.children.forEach((c: Token) => il.push(...parser(currentToken.context!, c)));
      } else {
        il.push(() => ({ ignore: true }));
      }
    },
    [TokenName.SPACE]: () => {
      il.push(() => ({
        raw: ' ',
        text: ' ',
      }));
    },
    [TokenName.TEXT]: (_, currentToken) => {
      il.push(() => ({
        raw: currentToken.value,
        text: String(currentToken.value),
        ignore: String(currentToken.value).trim() === '',
      }));
    },
    [TokenName.FILTER]: (scope, currentToken) => {
      const emptyObject = {};
      let givenScope = emptyObject;
      const rawScope = Array.isArray(scope) ? scope : [scope];
      for (let x = 0; x < rawScope.length; x += 1) {
        const item = rawScope[x];
        let match = false;
        for (let y = 0; y < currentToken.children.length; y += 1) {
          const [operation, leftOperand, rightOperand] = currentToken.children[y].children;
          if (rightOperand) {
            match = (Filters as any)[operation.token](item, leftOperand.value, rightOperand.value);
          } else {
            match = Boolean(item[leftOperand.value!]);
          }
          if (!match) { break; }
        }
        if (match) {
          givenScope = item;
          break;
        }
      }
      il.push(() => ({ givenScope, ignore: givenScope === emptyObject, text: '' }));
      currentToken.parent!.context = givenScope;
    },
    [TokenName.GROUP]: (scope, currentToken) => {
      currentToken.context = scope;
      const groupIL: ILToken[] = [];
      currentToken.children.forEach(c => groupIL.push(...parser(currentToken.context!, c)));
      il.push((idx, arr) => group(groupIL)(idx, arr));
    },
    [TokenName.OR]: () => {
      il.push((idx, arr) => {
        const previousIL = arr[idx - 1];
        const previous = previousIL(idx - 1, arr);
        if (!previous?.ignore) {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            // eslint-disable-next-line no-plusplus, no-param-reassign
            const next = arr[++idx](idx, arr);
            arr[idx] = () => ({ ignore: true });
            if (!('givenScope' in next)) { break; }
          }
        }
        return ({ ignore: false, text: '' });
      });
    },
    [TokenName.SPACESHIP]: (scope, currentToken) => {
      currentToken.context = scope;
      const spaceShipIL: ILToken[] = [];
      currentToken.children.forEach(c => spaceShipIL.push(...parser(currentToken.context!, c)));
      il.push((idx, arr) => {
        const previousIdx = idx - 1;
        const nextIdx = idx + 1;
        const previousIL = arr[previousIdx];
        const nextIL = arr[nextIdx];
        // TODO: Covert ILToken to (idx: Number, arr: ILToken[]) => Promise<ILCode>, to support lazy right to left recursive evaluations
        // today it does not support lazy right to left recursive evaluations
        // example {text left< 1 >< 2 >< 3 >text right}
        // it is not possible to evaluate 2 and 3, because it would end up in a infinite loop
        // to avoid it, we must lazy evaluate the result of il code.
        // this hack bellow was written to avoid endless loops
        let previous: ILCode = { ignore: true };// convert to promise
        let next: ILCode = { ignore: true }; // convert to promise

        arr[previousIdx] = () => previous;
        arr[nextIdx] = () => next;

        previous = typeof previousIL === 'function' ? previousIL(previousIdx, arr) : { ignore: false };
        next = typeof nextIL === 'function' ? nextIL(nextIdx, arr) : { ignore: false };

        if (!previous?.ignore && !next?.ignore) {
          return group(spaceShipIL)(idx, arr);
        }
        return ({ ignore: true });
      });
    },
    [TokenName.ROOT]: (_, currentToken) => {
      token.children.forEach((c: any) => il.push(...parser(currentToken.context!, c)));
    },
    [TokenName.RIGHT_OPERAND]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.NOT_EQUALS]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.LEFT_OPERAND]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.CONTAINS]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.STARTS_WITH]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.ENDS_WITH]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.EQUALS]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.FILTER_EXPRESSION]: () => {
      throw new Error('Function not implemented.');
    },
    [TokenName.NOT_EMPTY]: () => {
      throw new Error('Function not implemented.');
    },
  };
  token.context = obj;
  grammar[token.token](obj, token);
  return il;
};
