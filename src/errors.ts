export class InterpolationSyntaxError extends SyntaxError {
  override readonly name = 'InterpolationSyntaxError'
  readonly reason: string
  readonly offset: number
  readonly format: string

  constructor(reason: string, format: string, offset: number) {
    super(`${reason} at ${offset}\n  ${format}\n  ${' '.repeat(offset)}^`)
    this.reason = reason
    this.offset = offset
    this.format = format
  }
}
