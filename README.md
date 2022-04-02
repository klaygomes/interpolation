# Interpolation Library

Used primary to help users to evaluate and concatenate multiple fields and strings using a predefined set of rules.

Useful when we need to concatenate a separator only if two sides of an expressions has a value.

Example, imagine you want to include an `,` only if both of them have a value, eg.:

You have the following obj:

```
type Address = {
  street?: string,
  region?: string,
  city?: string,
  country?: string
}
```

and you want to concatenate following the pattern:

`${street}, ${region}, ${city}, ${country}`

You probably could end up with a code like so:

```
let address = obj.street;
address += obj.region ? `, ${obj.region}`: '';
address += obj.city ? `, ${obj.city}`: '';
address += obj.country ? `, ${obj.country}`: '';
```

Although this code works, it is not easy to maintain and it is not possible to move this to a JSON File, permitting it to be delivered as a configuration file by a backend implementation later on. Requiring you to publish a new version of your application each time you need to provide a new format.

Using the library you can write the same pattern as:

```
const fmt: string = '.street<, >.region<, >.city<, >.country';
const { interpolate } = interpolation(address);
const result = interpolate(fmt);
```

Notice that `fmt` string could be stored inside a JSON File and fetched only before the evaluation.

This library allows more complex interpolations like for example getting the `address_components` from the google provider api:

```
const address = {
  "address_components": [
    {
      "long_name": "22",
      "short_name": "22",
      "types": [
        "street_number",
        "address"
      ]
    },
    {
      "long_name": "Stadsgårdshamnen",
      "short_name": "Stadsgårdshamnen",
      "types": [
        "route"
      ]
    },
    {
      "long_name": "Sweden",
      "short_name": "SE",
      "types": [
        "country",
        "political"
      ]
    }
  },
  "geometry": {
    "location": {
      "lat": 59.3177862,
      "lng": 18.0849876
    },
    "viewport": {
      "south": 59.31643721970849,
      "west": 18.08363861970849,
      "north": 59.31913518029149,
      "east": 18.0863365802915
    }
  },
  "utc_offset": 120,
  "vicinity": "Södermalm",
}
```

NOTE: all examples from now on will assume you are using the following code:

```
const fmt: string = ...
const { interpolate } = interpolation(address);
const result = interpolate(fmt);
```
where `fmt` is the string shown in each the example.


So, to get the `route` value, `Stadsgårdshamnen`, you only need to write:


```
address_components[types=route].long_name
```

You can also write, more complex queries, like:

```
.address_components[types=country][short_name==GB]<.address_components[types=route].short_name>
```
result: `''`

Where it will only print `postal_code` if `address_components` array have a `type` property that contains `short_name` equals to `GB`.

The same expression, but written using vanilla JavaScript:
```javascript

const isGB = !address
  .address_components
  .filter(a => a.types.contains('country'))
  .filter(a => a.short_name ==='GB');

const result = isGB ?
  address
  .address_components
  .find(a => a.types.contains('route'))?.short_name : '';
```

## Interpolation query language
```
QUERY_LANGUAGE =  0*1GROUP 0*1SPACESHIP 0*1FIELD 0*1TEXT
GROUP = "{" QUERY_LANGUAGE "}"
SPACESHIP = "<" QUERY_LANGUAGE ">"
FILTER_OP = "*=" / "~=" / "*=" / "!=" / "|="
FILTER = "[" ( FIELD FILTER_OP ALPHA  /  FIELD ) [","] "]"
FIELD = "." 1*ALPHA [ FILTER / FIELD ]
TEXT = 1*ALPHA
```


### FIELD
`.field_name`**[field_name=some string] optional**

If `field_name` exists it will print the name.

you can access nested properties using normal dot notation:

`.geometry.location.lat`

result: `'59.3177862'`

You can also use filter expression to filter inside arrays or objects:

```.address_components[types=country].long_name```

result: `'Sweden'`

it will get the `address_components` array, filter by `[types=country]`, the object found will them be get by `.long_name`

You could write the same code with javascript like:

```
const item = address.address_components.find(a=> a.types==='country');
const address = item?.long_name

```

### FILTER
FILTER = "[" ( FIELD FILTER_OP ALPHA  /  FIELD ) [","] "]"

`[field_name=some_string, ...]` for equals
`[field_name!=some_string]` for not equals
`[field_name~=some_string]` or  `[field_name*=some string]`  for contains
`[field_name|=some_string]` for start with
`[field_name$=some_string]` for ends with
`[field_name]` field_name exists on the given object

You can use more than one filter expression by separating them with comma:

`[field_name,other_field=batata]`

It will verify if `field_name` exists and them, if `other_field` has the value `batata`.

A filter may or not have a field before. If not, it uses the parent context to do the filtering, after that changes *the parent context* with the result.

example:

```.address_components[types=country]we live in .long_name, its code is .shot_name```

result: `'we live in Sweden, its code is SE'`

On this example, `.some_field` will be affected by the filter as it changed the parent context (where field gets its information).

You can use inside a GROUP, it is useful when you have a lot of fields you want to display, but it is inside a property or a array.

### Spaceship
SPACESHIP = "<" QUERY_LANGUAGE ">"

If there is an expression on both the sides, it will evaluate each one and them print what is inside it, only if both of the expressions return a no empty string.

example:
```.field1< inside >.field2```

it will print `.field1` and `.field2`, only if both of the expressions return a value.

If there is only one expression on the left or on the right, it will consider that expression and print based on if it returns a no empty string, eg:

```.some_field< inside>```

or

```< inside>.some_field```

it will print ` inside` only if field has no empty value.

The left expression can be a `FIELD`, `GROUP`, unfortunately today we do not support spaceship expressions as siblings, if you try to use it you may get strange results.

### Group
GROUP = "{" QUERY_LANGUAGE "}"

Used to group expressions as they are only one, also carries its own context that can be modified by `FILTERS`.

example:

```{.address_components[types=country]we live in .long_name, its code is .shot_name}, my neighborhood is .vicinity```

result: `'we live in Sweden, its code is SE, my neighborhood is Södermalm`

On this example, `.some_field`, inside the group will be affected by the filter `.address_components[types=country]`  (where the field gets its information), but `.vicinity` not, because it is on a different context (outside the group).
































