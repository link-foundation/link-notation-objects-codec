# link-notation-objects-codec (JavaScript)

A JavaScript library to encode/decode objects to/from Links Notation format. This library provides universal serialization and deserialization for JavaScript objects, with built-in support for circular references and complex object graphs.

## Features

- **Universal Serialization**: Encode JavaScript objects to Links Notation format
- **Type Support**: Handle all common JavaScript types:
  - Basic types: `null`, `undefined`, `boolean`, `number`, `string`
  - Collections: `Array`, `Object`
  - Special number values: `NaN`, `Infinity`, `-Infinity`
- **Circular References**: Automatically detect and preserve circular references
- **Object Identity**: Maintain object identity for shared references
- **UTF-8 Support**: Full Unicode string support using base64 encoding
- **Simple API**: Easy-to-use `encode()` and `decode()` functions

## Installation

```bash
npm install link-notation-objects-codec
```

Or with other package managers:

```bash
# Bun
bun add link-notation-objects-codec

# Yarn
yarn add link-notation-objects-codec

# pnpm
pnpm add link-notation-objects-codec
```

## Quick Start

```javascript
import { encode, decode } from 'link-notation-objects-codec';

// Encode basic types
const encoded = encode({ name: 'Alice', age: 30, active: true });
console.log(encoded);
// Output: (object obj_0 ((str bmFt...) (int 30)) ((str YWN0...) (bool true)))

// Decode back to JavaScript object
const decoded = decode(encoded);
console.log(decoded);
// Output: { name: 'Alice', age: 30, active: true }

// Roundtrip preserves data
console.log(JSON.stringify(decoded) === JSON.stringify({ name: 'Alice', age: 30, active: true }));
// Output: true
```

## Usage Examples

### Basic Types

```javascript
import { encode, decode } from 'link-notation-objects-codec';

// null and undefined
console.log(decode(encode(null))); // null
console.log(decode(encode(undefined))); // undefined

// Booleans
console.log(decode(encode(true))); // true
console.log(decode(encode(false))); // false

// Numbers (integers and floats)
console.log(decode(encode(42))); // 42
console.log(decode(encode(-123))); // -123
console.log(decode(encode(3.14))); // 3.14

// Special number values
console.log(decode(encode(Infinity))); // Infinity
console.log(decode(encode(-Infinity))); // -Infinity
console.log(Number.isNaN(decode(encode(NaN)))); // true

// Strings (with full Unicode support)
console.log(decode(encode('hello'))); // 'hello'
console.log(decode(encode('你好世界 🌍'))); // '你好世界 🌍'
console.log(decode(encode('multi\nline\nstring'))); // 'multi\nline\nstring'
```

### Collections

```javascript
import { encode, decode } from 'link-notation-objects-codec';

// Arrays
const data = [1, 2, 3, 'hello', true, null];
console.log(JSON.stringify(decode(encode(data))) === JSON.stringify(data)); // true

// Nested arrays
const nested = [[1, 2], [3, 4], [5, [6, 7]]];
console.log(JSON.stringify(decode(encode(nested))) === JSON.stringify(nested)); // true

// Objects
const person = {
  name: 'Bob',
  age: 25,
  email: 'bob@example.com',
};
console.log(JSON.stringify(decode(encode(person))) === JSON.stringify(person)); // true

// Complex nested structures
const complexData = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  metadata: {
    version: 1,
    count: 2,
  },
};
console.log(JSON.stringify(decode(encode(complexData))) === JSON.stringify(complexData)); // true
```

### Circular References

The library automatically handles circular references and shared objects:

```javascript
import { encode, decode } from 'link-notation-objects-codec';

// Self-referencing array
const arr = [1, 2, 3];
arr.push(arr); // Circular reference
const encoded = encode(arr);
const decoded = decode(encoded);
console.log(decoded[3] === decoded); // true - Reference preserved

// Self-referencing object
const obj = { name: 'root' };
obj.self = obj; // Circular reference
const encoded2 = encode(obj);
const decoded2 = decode(encoded2);
console.log(decoded2.self === decoded2); // true - Reference preserved

// Shared references
const shared = { shared: 'data' };
const container = { first: shared, second: shared };
const encoded3 = encode(container);
const decoded3 = decode(encoded3);
// Both references point to the same object
console.log(decoded3.first === decoded3.second); // true

// Complex circular structure (tree with back-references)
const root = { name: 'root', children: [] };
const child = { name: 'child', parent: root };
root.children.push(child);
const encoded4 = encode(root);
const decoded4 = decode(encoded4);
console.log(decoded4.children[0].parent === decoded4); // true
```

## How It Works

The library uses the [links-notation](https://github.com/link-foundation/links-notation) format as the serialization target. Each JavaScript object is encoded as a Link with type information:

- Basic types are encoded with type markers: `(int 42)`, `(str "hello")`, `(bool true)`
- Strings are base64-encoded to handle special characters and newlines
- Collections include object IDs for reference tracking: `(array obj_0 item1 item2 ...)`
- Circular references use special `ref` links: `(ref obj_0)`

This approach allows for:
- Universal representation of object graphs
- Preservation of object identity
- Natural handling of circular references
- Human-readable (somewhat) output

## API Reference

### `encode(obj)`

Encode a JavaScript object to Links Notation format.

**Parameters:**
- `obj` - The JavaScript object to encode

**Returns:**
- String representation in Links Notation format

**Throws:**
- `TypeError` - If the object type is not supported

### `decode(notation)`

Decode Links Notation format to a JavaScript object.

**Parameters:**
- `notation` - String in Links Notation format

**Returns:**
- Reconstructed JavaScript object

### `ObjectCodec`

The main codec class that performs encoding and decoding. The module-level `encode()` and `decode()` functions use a shared instance of this class.

If you need isolated encoding contexts (for example, in multi-threaded environments), you can create your own codec instances:

```javascript
import { ObjectCodec } from 'link-notation-objects-codec';

const codec = new ObjectCodec();
const encoded = codec.encode({ data: [1, 2, 3] });
const decoded = codec.decode(encoded);
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/link-foundation/link-notation-objects-codec.git
cd link-notation-objects-codec/js

# Install dependencies
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run example
npm run example
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Add tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the Unlicense - see the [LICENSE](../LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/link-foundation/link-notation-objects-codec)
- [Links Notation Specification](https://github.com/link-foundation/links-notation)
- [npm Package](https://www.npmjs.com/package/link-notation-objects-codec/)
- [Python Implementation](../python/)

## Acknowledgments

This project is built on top of the [links-notation](https://github.com/link-foundation/links-notation) library.
