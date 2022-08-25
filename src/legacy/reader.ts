export const reader = (stream: string | string[]) => ({
  i: 0,
  frag: '',
  ignore: false,
  read() {
    this.ignore = false
    return stream[this.i++]
  },
  fragment(frag?: string) {
    if (frag) this.frag = frag
    return this.frag
  },
  fragmentUpdate() {
    if (!this.ignore) this.frag += this.look()
  },
  fragmentClear() {
    this.frag = ''
  },
  ignoreCurrentChar() {
    this.ignore = true
  },
  look() {
    return stream[this.i - 1] || ''
  },
  forward() {
    this.read()
  },
  lookAhead(i = 0) {
    const ahead = this.i + i
    return stream[ahead]
  },
  lookBack(i = 2) {
    const back = this.i - i
    return stream[back]
  },
  more(i = 0) {
    return this.i + i < stream.length
  },
})
