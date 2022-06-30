import { interpolation } from '.';
import address from './fixtures/google-stadsgardshamnen22.se.json';

describe('interpolation', () => {
  it('should extract field', () => {
    expect.assertions(1);
    const { interpolate } = interpolation(address);
    const fmt = '.formatted_address';
    expect(interpolate(fmt)).toBe(address.formatted_address);
  });
  it('should extract field of a field', () => {
    expect.assertions(1);
    const { interpolate } = interpolation(address);
    const fmt = '.plus_code.compound_code';
    expect(interpolate(fmt)).toBe(address.plus_code.compound_code);
  });
  it('should extract field of a field of a field', () => {
    expect.assertions(1);
    const { interpolate } = interpolation(address);
    const fmt = '.geometry.viewport.south';
    expect(interpolate(fmt)).toBe(String(address.geometry.viewport.south));
  });

  it('should extract field + space + random text', () => {
    expect.assertions(1);
    const { interpolate } = interpolation(address);
    const fmt = '.plus_code.compound_code hello world!';
    expect(interpolate(fmt)).toBe(`${address.plus_code.compound_code} hello world!`);
  });

  it('should extract field after filtering, equals', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types=route,types=route].long_name';
    expect(interpolate(fmt)).toBe('Stadsgårdshamnen');
    const fmt2 = '.address_components[short_name=Södermalm].long_name';
    expect(interpolate(fmt2)).toBe('Södermalm');
  });


  it('should extract field after filtering, two equals', () => {
    expect.assertions(3);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types=route].long_name';
    expect(interpolate(fmt)).toBe('Stadsgårdshamnen');
    const fmt2 = '.address_components[short_name=Södermalm,short_name=Södermalm].long_name';
    expect(interpolate(fmt2)).toBe('Södermalm');
    const fmt3 = '.address_components[short_name=Södermalm,short_name=another].long_name';
    expect(interpolate(fmt3)).toBe('');
  });

  it('should extract field after filtering, equals + random text', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types=route].long_name i\'m random';
    expect(interpolate(fmt)).toBe('Stadsgårdshamnen i\'m random');
    const fmt2 = '.address_components[short_name=Södermalm].long_name i\'m random';
    expect(interpolate(fmt2)).toBe('Södermalm i\'m random');
  });

  it('should extract field after filtering, not equals', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types!=address].long_name';
    expect(interpolate(fmt)).toBe('Sweden');
    const fmt2 = '.address_components[short_name!=Södermalm].long_name';
    expect(interpolate(fmt2)).toBe('22');
  });

  it('should extract field after filtering, not equals + random text', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types!=address].long_name super random';
    expect(interpolate(fmt)).toBe('Sweden super random');
    const fmt2 = '.address_components[short_name!=Södermalm].long_name super random';
    expect(interpolate(fmt2)).toBe('22 super random');
  });

  it('should extract field after filtering, contains', () => {
    expect.assertions(4);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types*=stal_to].long_name';
    expect(interpolate(fmt)).toBe('Stockholm');
    const fmt2 = '.address_components[types~=stal_to].long_name';
    expect(interpolate(fmt2)).toBe('Stockholm');
    const fmt3 = '.address_components[short_name*=ermalm].long_name';
    expect(interpolate(fmt3)).toBe('Södermalm');
    const fmt4 = '.address_components[short_name~=Söderm].long_name';
    expect(interpolate(fmt4)).toBe('Södermalm');
  });
  it('should extract field after filtering, starts with', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types|=administrative].long_name';
    expect(interpolate(fmt)).toBe('Stockholms län');
    const fmt2 = '.address_components[long_name|=Stockholms].long_name';
    expect(interpolate(fmt2)).toBe('Stockholms län');
  });
  it('should extract field after filtering, ends with', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types$=level_1].long_name';
    expect(interpolate(fmt)).toBe('Södermalm');
    const fmt2 = '.address_components[long_name$=malm].long_name';
    expect(interpolate(fmt2)).toBe('Södermalm');
  });
  it('should extract group text', () => {
    expect.assertions(1);
    const { interpolate } = interpolation(address);
    const fmt = '{i"m a group}';
    expect(interpolate(fmt)).toBe('i"m a group');
  });
  it('should extract group + field + text', () => {
    expect.assertions(1);
    const { interpolate } = interpolation(address);
    const fmt = '{.address_components[types!=address].long_name i"m a group}';
    expect(interpolate(fmt)).toBe('Sweden i"m a group');
  });

  it('should only print if we have both fields', () => {
    expect.assertions(7);
    const { interpolate } = interpolation(address);
    const fmt = '.address_components[types!=address].long_name< inside >.vicinity';
    expect(interpolate(fmt)).toBe('Sweden inside Södermalm');
    const fmt2 = '.address_components[types!=address].long_name< inside >.vic';
    expect(interpolate(fmt2)).toBe('Sweden');
    const fmt3 = '.address_components[types=ad].long_name< inside >.vicinity';
    expect(interpolate(fmt3)).toBe('Södermalm');
    const fmt4 = '.address_components[types=address].long_name< inside >{.vicinity< ahoy >[utc_offset=120].name}';
    expect(interpolate(fmt4)).toBe('22 inside Södermalm ahoy Stadsgårdshamnen 22');
    const fmt5 = '.address_components[types=address].long_nam< inside >{.vicinity< ahoy >[utc_offset=120].name}';
    expect(interpolate(fmt5)).toBe('Södermalm ahoy Stadsgårdshamnen 22');
    const fmt6 = '.address_components[types=address].long_nam< inside >{.vicinit< ahoy >[utc_offset=120].name}';
    expect(interpolate(fmt6)).toBe('Stadsgårdshamnen 22');
    const fmt7 = '.address_components[types=address].long_name< inside >{.vicinit< ahoy >[utc_offset=120].nam}';
    expect(interpolate(fmt7)).toBe('22');
  });

  /* unexpected cases */
  it('a group inside another group', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '{a{, }{b{, }{c{, }{[utc_offset].vicinity}}}}';
    expect(interpolate(fmt)).toBe('a, b, c, Södermalm');
    const fmt2 = '{a, {b{c}}}}}';
    expect(interpolate(fmt2)).toBe('a, bc');
  });
  it('escape', () => {
    expect.assertions(3);
    const { interpolate } = interpolation(address);
    const fmt = '\\.it_is_not_a_field';
    expect(interpolate(fmt)).toBe('\\.it_is_not_a_field');
    const fmt2 = '{\\.it_is_not_a_field}';
    expect(interpolate(fmt2)).toBe('\\.it_is_not_a_field');
    const fmt3 = '\\{\\.it_is_not_a_field\\}';
    expect(interpolate(fmt3)).toBe('\\{\\.it_is_not_a_field\\}');
  });
  it('no fmt value', () => {
    expect.assertions(1);
    const { interpolate } = interpolation(address);
    const fmt = undefined;
    expect(interpolate(fmt)).toBe('');
  });
  it('field exists', () => {
    expect.assertions(3);
    const { interpolate } = interpolation(address);
    const fmt = '[utc_offset].vicinity';
    expect(interpolate(fmt)).toBe('Södermalm');
    const fmt2 = '[_offset].vicinity';
    expect(interpolate(fmt2)).toBe('');
    const fmt3 = '[_offset,utc_offset].vicinity';
    expect(interpolate(fmt3)).toBe('');
  });
  it('root input of a filter is not a array', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '[utc_offset=120].vicinity';
    expect(interpolate(fmt)).toBe('Södermalm');
    const fmt2 = '[utc_offset=121].vicinity';
    expect(interpolate(fmt2)).toBe('');
  });

  it('text + spaceship + text', () => {
    expect.assertions(3);
    const { interpolate } = interpolation(address);
    const fmt = '{{[utc_offset=121] \\.vicinity por que?}<1> text left< 1 >< 2 >< 3 >.vicinity}';
    expect(interpolate(fmt)).toBe(' \\.vicinity por que?1 text leftSödermalm'); // catch endless loops
    // expected result when lazy evaluation implemented
    // expect(interpolate(fmt)).toBe('text lef 1  2  3 tSödermalm');
    const fmt2 = '{{}{<{1<2>}>{}}}';
    expect(interpolate(fmt2)).toBe('12');
    const fmt3 = '.address_components[types=country][short_name==GB]<.address_components[types=postal_code].short_name>';
    expect(interpolate(fmt3)).toBe('');
  });
  it('or', () => {
    expect.assertions(2);
    const { interpolate } = interpolation(address);
    const fmt = '{[utc_offset=120].vicinity}|.utc_offset';
    expect(interpolate(fmt)).toBe('Södermalm');
    const fmt2 = '{[utc_offset=110].vicinity}|.utc_offset';
    expect(interpolate(fmt2)).toBe('120');
  });
  it('no unwanted spaces', () => {
    expect.hasAssertions();
    const { interpolate } = interpolation({ street_address: '', region: '' });
    const fmt = '.street_address2<, >.street_address<, >.city<, >{.region< >.postal_code}';
    expect(interpolate(fmt)).toBe('');
  });
  // data mapping bugs
  it('U Jezera 767/', () => {
    expect.hasAssertions();
    const data = require('./fixtures/google-u-jezera-767.cz.json');
    const { interpolate } = interpolation(data.result);
    const fmt = '.address_components[types=route].short_name< >{.address_components[types=premise].short_name</>.address_components[types=street_number].short_name}';
    expect(interpolate(fmt)).toBe('U Jezera 767, 281 51 Velký Osek');
  });
});
