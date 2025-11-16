# link-notation-objects-codec

[![Tests](https://github.com/link-foundation/link-notation-objects-codec/actions/workflows/test.yml/badge.svg)](https://github.com/link-foundation/link-notation-objects-codec/actions/workflows/test.yml)
[![Python Version](https://img.shields.io/pypi/pyversions/link-notation-objects-codec.svg)](https://pypi.org/project/link-notation-objects-codec/)

Universal serialization library to encode/decode objects to/from Links Notation format. Available in both **Python** and **JavaScript** with identical functionality and API design.

## 🌍 Multi-Language Support

This library provides universal serialization and deserialization with built-in support for circular references and complex object graphs in:

- **[Python](python/)** - Full implementation for Python 3.8+
- **[JavaScript](js/)** - Full implementation for Node.js 18+

Both implementations share the same design philosophy and provide feature parity.

## Features

- **Universal Serialization**: Encode objects to Links Notation format
- **Type Support**: Handle all common types in each language:
  - **Python**: `None`, `bool`, `int`, `float`, `str`, `list`, `dict`
  - **JavaScript**: `null`, `undefined`, `boolean`, `number`, `string`, `Array`, `Object`
  - Special float/number values: `NaN`, `Infinity`, `-Infinity`
- **Circular References**: Automatically detect and preserve circular references
- **Object Identity**: Maintain object identity for shared references
- **UTF-8 Support**: Full Unicode string support using base64 encoding
- **Simple API**: Easy-to-use `encode()` and `decode()` functions

## Quick Start

### Python

```bash
pip install link-notation-objects-codec
```

```python
from link_notation_objects_codec import encode, decode

# Encode and decode
data = {"name": "Alice", "age": 30, "active": True}
encoded = encode(data)
decoded = decode(encoded)
assert decoded == data
```

### JavaScript

```bash
npm install link-notation-objects-codec
```

```javascript
import { encode, decode } from 'link-notation-objects-codec';

// Encode and decode
const data = { name: 'Alice', age: 30, active: true };
const encoded = encode(data);
const decoded = decode(encoded);
console.log(JSON.stringify(decoded) === JSON.stringify(data)); // true
```

## Repository Structure

```
.
├── python/           # Python implementation
│   ├── src/         # Source code
│   ├── tests/       # Test suite
│   ├── examples/    # Usage examples
│   └── README.md    # Python-specific docs
├── js/              # JavaScript implementation
│   ├── src/         # Source code
│   ├── tests/       # Test suite
│   ├── examples/    # Usage examples
│   └── README.md    # JavaScript-specific docs
└── README.md        # This file
```

## Language-Specific Documentation

For detailed documentation, API reference, and examples, see:

- **[Python Documentation](python/README.md)**
- **[JavaScript Documentation](js/README.md)**

## Usage Examples

Both implementations support the same features with language-appropriate syntax:

### Circular References

**Python:**
```python
from link_notation_objects_codec import encode, decode

# Self-referencing list
lst = [1, 2, 3]
lst.append(lst)
decoded = decode(encode(lst))
assert decoded[3] is decoded  # Reference preserved
```

**JavaScript:**
```javascript
import { encode, decode } from 'link-notation-objects-codec';

// Self-referencing array
const arr = [1, 2, 3];
arr.push(arr);
const decoded = decode(encode(arr));
console.log(decoded[3] === decoded); // true - Reference preserved
```

### Complex Nested Structures

**Python:**
```python
data = {
    "users": [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"}
    ],
    "metadata": {"version": 1, "count": 2}
}
assert decode(encode(data)) == data
```

**JavaScript:**
```javascript
const data = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ],
  metadata: { version: 1, count: 2 }
};
console.log(JSON.stringify(decode(encode(data))) === JSON.stringify(data));
```

## How It Works

The library uses the [links-notation](https://github.com/link-foundation/links-notation) format as the serialization target. Each object is encoded as a Link with type information:

- Basic types are encoded with type markers: `(int 42)`, `(str "hello")`, `(bool True)`
- Strings are base64-encoded to handle special characters and newlines
- Collections include object IDs for reference tracking: `(list obj_0 item1 item2 ...)`
- Circular references use special `ref` links: `(ref obj_0)`

This approach allows for:
- Universal representation of object graphs
- Preservation of object identity
- Natural handling of circular references
- Cross-language compatibility

## Development

### Python

```bash
cd python
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest tests/ -v
```

### JavaScript

```bash
cd js
npm install
npm test
npm run example
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Add tests for your changes
4. Ensure all tests pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the Unlicense - see the [LICENSE](LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/link-foundation/link-notation-objects-codec)
- [Links Notation Specification](https://github.com/link-foundation/links-notation)
- [PyPI Package](https://pypi.org/project/link-notation-objects-codec/) (Python)
- [npm Package](https://www.npmjs.com/package/link-notation-objects-codec/) (JavaScript)

## Acknowledgments

This project is built on top of the [links-notation](https://github.com/link-foundation/links-notation) library.
