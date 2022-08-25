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
        // TODO: please remove the eslint-disable in the file and address the non-null-assertion
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        text: acc.text! + cur.text,
        raw: acc.raw + cur.raw,
        ignore: false,
      }),
      ret
    )
  }
