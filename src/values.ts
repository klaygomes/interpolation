import type { Condition, FilterSegment, Segment } from './ast'

type Scalar = string | number | boolean | bigint

const isScalar = (value: unknown): value is Scalar =>
  ['string', 'number', 'boolean', 'bigint'].includes(typeof value)

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const scalarText = (value: unknown) => {
  if (typeof value === 'string') return value.trim() === '' ? '' : value
  if (typeof value === 'number' && Number.isNaN(value)) return ''
  return isScalar(value) ? String(value) : ''
}

export const toText = (value: unknown): string =>
  Array.isArray(value) ? value.flat(Infinity).map(scalarText).filter(Boolean).join(', ') : scalarText(value)

const read = (value: unknown, key: string) => (isRecord(value) && Object.hasOwn(value, key) ? value[key] : undefined)

const isPresent = (value: unknown) => value !== undefined && value !== null && value !== ''

const matches = (item: unknown, { name, operator, value: expected = '' }: Condition) => {
  const actual = read(item, name)
  if (!operator) return isPresent(actual)
  const candidates = [actual].flat(Infinity).filter(isScalar).map(String)
  switch (operator) {
    case '=':
      return candidates.includes(expected)
    case '!=':
      return !candidates.includes(expected)
    case '*=':
    case '~=':
      return candidates.some((candidate) => candidate.includes(expected))
    case '|=':
      return candidates.some((candidate) => candidate.startsWith(expected))
    case '$=':
      return candidates.some((candidate) => candidate.endsWith(expected))
  }
}

export const applyFilter = (value: unknown, filter: FilterSegment): unknown => {
  const candidates = Array.isArray(value) ? value : isPresent(value) ? [value] : []
  const selected = candidates.filter((item) => filter.conditions.every((condition) => matches(item, condition)))
  return filter.all ? selected : selected[0]
}

export const passesGuard = (scope: unknown, guard: FilterSegment) => {
  const selected = applyFilter(scope, guard)
  return Array.isArray(selected) ? selected.length > 0 : selected !== undefined
}

const step = (value: unknown, segment: Segment): unknown => {
  if (value === undefined || value === null) return undefined
  if (segment.type === 'filter') return applyFilter(value, segment)
  if (!Array.isArray(value)) return read(value, segment.name)
  if (segment.index) return value.at(Number(segment.name))
  return value.flatMap((item) => read(item, segment.name) ?? [])
}

export const resolve = (scope: unknown, segments: readonly Segment[]) => segments.reduce(step, scope)
