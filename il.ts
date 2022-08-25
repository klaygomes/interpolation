import { ILToken, ILCode } from './types'

export const interpret = (il: ILToken[]) =>
  il
    .map((i, idx, arr) => i(idx, arr))
    .filter((f) => !f.ignore)
    .reduce((acc, cur) => acc + cur.text, '')

export const group =
  (args: ILToken[]): ILToken =>
  () => {
    const values = args.map((i, idx, arr) => i(idx, arr))
    const onlyValid = values.filter((i) => !i?.ignore)

    const ret: ILCode = {
      text: '',
      raw: '',
      ignore: true,
    }
    return onlyValid.reduce(
      (acc, cur) => ({
        text: acc.text! + cur.text,
        raw: acc.raw + cur.raw,
        ignore: false,
      }),
      ret
    )
  }
