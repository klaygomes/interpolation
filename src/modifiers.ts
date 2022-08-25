export const MODIFIERS = {
  upper: (text: string) => text.toUpperCase(),
  lower: (text: string) => text.toLowerCase(),
  title: (text: string) => text.replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) => space + letter.toUpperCase()),
  trim: (text: string) => text.trim(),
}

export type ModifierName = keyof typeof MODIFIERS

export const isModifierName = (name: string): name is ModifierName => Object.hasOwn(MODIFIERS, name)

export const applyModifiers = (text: string, modifiers: readonly ModifierName[]) =>
  modifiers.reduce((current, name) => MODIFIERS[name](current), text)
