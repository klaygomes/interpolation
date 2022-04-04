/* eslint-disable jest/no-export */
import { Token, TokenName, ILToken, ILCode, TGrammar, TContext } from './types';
import { group } from './il';
import { Filters } from './tokenizer/tokenizerFilter';

export const parser = <T>(obj: TContext, token: Token<T>) => {
  const il: ILToken[] = [];
  const grammar: TGrammar = {
    [TokenName.FIELD]: (scope, currentToken) => {
      const nextScope = scope[currentToken.value!] as TContext;
      if (nextScope) {
        if (!currentToken.children.length) {
          il.push(() => ({
            raw: nextScope,
            text: String(nextScope),
            ignore: !Boolean(nextScope)
          }));
        }
        currentToken.context = nextScope;
        //const fieldIL: ILToken[] = [];
        currentToken.children.forEach((c: Token<T>) => il.push(...parser(currentToken.context!, c)));
        //il.push((idx, arr) => group(fieldIL)(idx, arr));
      }
    },
    [TokenName.SPACE]: () => {
      il.push(() => ({
        raw: ' ',
        text: ' '
      }));
    },
    [TokenName.TEXT]: (_, currentToken) => {
      il.push(() => ({
        raw: currentToken.value,
        text: String(currentToken.value),
        ignore: !Boolean(currentToken.value)
      }));
    },
    [TokenName.FILTER]: (scope, currentToken) => {
      let givenScope = {};
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
      currentToken.parent!.context = givenScope;
    },
    [TokenName.GROUP]: (scope, currentToken) => {
      currentToken.context = scope;
      const groupIL: ILToken[] = [];
      currentToken.children.forEach(c => groupIL.push(...parser(currentToken.context!, c)));
      il.push((idx, arr) => group(groupIL)(idx, arr));
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
        // TODO: ILToken covert to (idx: Number, arr: ILToken[]) => Promise<ILCode>, to support lazy right to left recursive evaluations
        // today it does not support lazy right to left recursive evaluations
        // example {text left< 1 >< 2 >< 3 >text right}, this hack bellow avoids endless loops
        let previous: ILCode = { ignore: true };// convert to promise
        let next: ILCode = { ignore: true }; // convert to promise
        arr[previousIdx] = () => previous;
        arr[nextIdx] = () => next;
        previous = typeof previousIL === 'function' ? previousIL(previousIdx, arr) : { ignore: true };
        next = typeof nextIL === 'function' ? nextIL(nextIdx, arr) : { ignore: true };
        if (!previous?.ignore && !next?.ignore) {
          return group(spaceShipIL)(idx, arr);
        }
        return ({ ignore: true });
      });
    },
    [TokenName.ROOT]: (_, currentToken) => {
      token.children.forEach(c => il.push(...parser(currentToken.context!, c)));
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
    }
  };
  token.context = obj;
  grammar[token.token](obj, token);
  return il;
};
