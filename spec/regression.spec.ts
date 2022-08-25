import { describe, expect, it } from 'vitest'
import { format, InterpolationSyntaxError } from '../src'
import place from './fixtures/google-stadsgardshamnen22.se.json'
import czechPlace from './fixtures/google-u-jezera-767.cz.json'

const cases: [string, string, string][] = [
  ['extracts a field', '.formatted_address', place.formatted_address],
  ['extracts a nested field', '.plus_code.compound_code', place.plus_code.compound_code],
  ['extracts a deeply nested number', '.geometry.viewport.south', String(place.geometry.viewport.south)],
  ['keeps text after a field', '.plus_code.compound_code hello world!', `${place.plus_code.compound_code} hello world!`],
  ['filters with repeated equals', '.address_components[types=route,types=route].long_name', 'Stadsgårdshamnen'],
  ['filters with equals on a scalar', '.address_components[short_name=Södermalm].long_name', 'Södermalm'],
  ['filters with two matching conditions', '.address_components[short_name=Södermalm,short_name=Södermalm].long_name', 'Södermalm'],
  ['filters with one failing condition', '.address_components[short_name=Södermalm,short_name=another].long_name', ''],
  ['keeps text after a filtered field', ".address_components[types=route].long_name i'm random", "Stadsgårdshamnen i'm random"],
  ['filters with not equals on an array', '.address_components[types!=address].long_name', 'Sweden'],
  ['filters with not equals on a scalar', '.address_components[short_name!=Södermalm].long_name', '22'],
  ['keeps text after not equals', '.address_components[types!=address].long_name super random', 'Sweden super random'],
  ['filters with *= contains', '.address_components[types*=stal_to].long_name', 'Stockholm'],
  ['filters with ~= contains', '.address_components[types~=stal_to].long_name', 'Stockholm'],
  ['filters with contains on a scalar', '.address_components[short_name*=ermalm].long_name', 'Södermalm'],
  ['filters with |= starts with', '.address_components[types|=administrative].long_name', 'Stockholms län'],
  ['filters with starts with on a scalar', '.address_components[long_name|=Stockholms].long_name', 'Stockholms län'],
  ['filters with $= ends with', '.address_components[types$=level_1].long_name', 'Södermalm'],
  ['filters with ends with on a scalar', '.address_components[long_name$=malm].long_name', 'Södermalm'],
  ['prints group text', '{i"m a group}', 'i"m a group'],
  ['prints a group with a field', '{.address_components[types!=address].long_name i"m a group}', 'Sweden i"m a group'],
  ['joins both operands', '.address_components[types!=address].long_name< inside >.vicinity', 'Sweden inside Södermalm'],
  ['drops a separator without right operand', '.address_components[types!=address].long_name< inside >.vic', 'Sweden'],
  ['drops a separator without left operand', '.address_components[types=ad].long_name< inside >.vicinity', 'Södermalm'],
  [
    'nests chains inside groups',
    '.address_components[types=address].long_name< inside >{.vicinity< ahoy >{[utc_offset=120].name}}',
    '22 inside Södermalm ahoy Stadsgårdshamnen 22',
  ],
  [
    'drops the separator before the first surviving operand',
    '.address_components[types=address].long_nam< inside >{.vicinity< ahoy >{[utc_offset=120].name}}',
    'Södermalm ahoy Stadsgårdshamnen 22',
  ],
  [
    'keeps a single surviving operand',
    '.address_components[types=address].long_nam< inside >{.vicinit< ahoy >{[utc_offset=120].name}}',
    'Stadsgårdshamnen 22',
  ],
  [
    'treats a group without filled fields as empty',
    '.address_components[types=address].long_name< inside >{.vicinit< ahoy >{[utc_offset=120].nam}}',
    '22',
  ],
  ['nests groups', '{a{, }{b{, }{c{, }{[utc_offset].vicinity}}}}', 'a, b, c, Södermalm'],
  ['escapes a field', '\\.it_is_not_a_field', '.it_is_not_a_field'],
  ['escapes a field inside a group', '{\\.it_is_not_a_field}', '.it_is_not_a_field'],
  ['escapes braces', '\\{\\.it_is_not_a_field\\}', '{.it_is_not_a_field}'],
  ['returns empty for an empty template', '', ''],
  ['guards on field presence', '[utc_offset].vicinity', 'Södermalm'],
  ['fails a guard on a missing field', '[_offset].vicinity', ''],
  ['fails a guard when any condition fails', '[_offset,utc_offset].vicinity', ''],
  ['guards on a scalar root', '[utc_offset=120].vicinity', 'Södermalm'],
  ['fails a guard on a different value', '[utc_offset=121].vicinity', ''],
  ['nests separators inside separators', '{{}{<{1<2>}>{x}}}', '12x'],
  [
    'drops a trailing separator after an empty operand',
    '.address_components[types=country][short_name=GB]<.address_components[types=postal_code].short_name>',
    '',
  ],
  ['falls back when the first option is filled', '{[utc_offset=120].vicinity}|.utc_offset', 'Södermalm'],
  ['falls back when the first option is empty', '{[utc_offset=110].vicinity}|.utc_offset', '120'],
]

describe('regression', () => {
  it.each(cases)('%s', (_, template, expected) => {
    expect(format(template, place)).toBe(expected)
  })

  it('prints nothing when every chained field is empty', () => {
    const template = '.street_address2<, >.street_address<, >.city<, >{.region< >.postal_code}'
    expect(format(template, { street_address: '', region: '' })).toBe('')
  })

  it('formats a Czech address with premise and street number', () => {
    const template =
      '.address_components[types=route].short_name< >{.address_components[types=premise].short_name</>.address_components[types=street_number].short_name}<, >.address_components[types=postal_code].short_name< >.address_components[types=locality].short_name'
    expect(format(template, czechPlace.result)).toBe('U Jezera 767, 281 51 Velký Osek')
  })

  it.each([
    ['stray closing braces', '{a, {b{c}}}}}'],
    ['back to back separators', '{{[utc_offset=121] \\.vicinity}<1> text left< 1 >< 2 >< 3 >.vicinity}'],
    ['a double equals operator', '.address_components[short_name==GB]'],
  ])('rejects %s', (_, template) => {
    expect(() => format(template, place)).toThrow(InterpolationSyntaxError)
  })
})
