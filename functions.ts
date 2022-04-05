export const FUNCTIONS = {
  '!': (str?: string) => String(str).toUpperCase(),
  '?': (str?: string) => String(str).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
};
