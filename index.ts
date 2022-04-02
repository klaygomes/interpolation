import { reader } from './reader';
import { tokenizer } from './tokenizer';
import { parser } from './parser';
import { interpret } from './il';

export const interpolation = (obj: Record<string, unknown>) => ({
  interpolate(fmt: string | undefined) {
    if (!fmt) return '';
    const r = reader(fmt);
    const t = tokenizer(r);
    const il = parser(obj, t);
    return interpret(il);
  }
});
