# link-notation-objects-codec (Python)

[![Tests](https://github.com/link-foundation/link-notation-objects-codec/actions/workflows/test.yml/badge.svg)](https://github.com/link-foundation/link-notation-objects-codec/actions/workflows/test.yml)
[![Python Version](https://img.shields.io/pypi/pyversions/link-notation-objects-codec.svg)](https://pypi.org/project/link-notation-objects-codec/)

A Python library to encode/decode objects to/from Links Notation format. This library provides universal serialization and deserialization for Python objects, with built-in support for circular references and complex object graphs.

## Features

- **Universal Serialization**: Encode Python objects to Links Notation format
- **Type Support**: Handle all common Python types:
  - Basic types: `None`, `bool`, `int`, `float`, `str`
  - Collections: `list`, `dict`
  - Special float values: `NaN`, `Infinity`, `-Infinity`
- **Circular References**: Automatically detect and preserve circular references
- **Object Identity**: Maintain object identity for shared references
- **UTF-8 Support**: Full Unicode string support using base64 encoding
- **Simple API**: Easy-to-use `encode()` and `decode()` functions

## Installation

```bash
pip install link-notation-objects-codec
```

## Quick Start

```python
from link_notation_objects_codec import encode, decode

# Encode basic types
encoded = encode({"name": "Alice", "age": 30, "active": True})
print(encoded)
# Output: (dict obj_0 ((str bm5h...) (int 30)) ((str YWN0...) (bool True)))

# Decode back to Python object
decoded = decode(encoded)
print(decoded)
# Output: {'name': 'Alice', 'age': 30, 'active': True}

# Roundtrip preserves data
assert decoded == {"name": "Alice", "age": 30, "active": True}
```

## Usage Examples

### Basic Types

```python
from link_notation_objects_codec import encode, decode

# None
assert decode(encode(None)) is None

# Booleans
assert decode(encode(True)) is True
assert decode(encode(False)) is False

# Integers
assert decode(encode(42)) == 42
assert decode(encode(-123)) == -123

# Floats
assert decode(encode(3.14)) == 3.14
assert decode(encode(float('inf'))) == float('inf')
assert decode(encode(float('nan')))  # NaN != NaN, but both are NaN

# Strings (with full Unicode support)
assert decode(encode("hello")) == "hello"
assert decode(encode("你好世界 🌍")) == "你好世界 🌍"
assert decode(encode("multi\nline\nstring")) == "multi\nline\nstring"
```

### Collections

```python
from link_notation_objects_codec import encode, decode

# Lists
data = [1, 2, 3, "hello", True, None]
assert decode(encode(data)) == data

# Nested lists
nested = [[1, 2], [3, 4], [5, [6, 7]]]
assert decode(encode(nested)) == nested

# Dictionaries
person = {
    "name": "Bob",
    "age": 25,
    "email": "bob@example.com"
}
assert decode(encode(person)) == person

# Complex nested structures
complex_data = {
    "users": [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"}
    ],
    "metadata": {
        "version": 1,
        "count": 2
    }
}
assert decode(encode(complex_data)) == complex_data
```

### Circular References

The library automatically handles circular references and shared objects:

```python
from link_notation_objects_codec import encode, decode

# Self-referencing list
lst = [1, 2, 3]
lst.append(lst)  # Circular reference
encoded = encode(lst)
decoded = decode(encoded)
assert decoded[3] is decoded  # Reference preserved

# Self-referencing dictionary
d = {"name": "root"}
d["self"] = d  # Circular reference
encoded = encode(d)
decoded = decode(encoded)
assert decoded["self"] is decoded  # Reference preserved

# Shared references
shared = {"shared": "data"}
container = {"first": shared, "second": shared}
encoded = encode(container)
decoded = decode(encoded)
# Both references point to the same object
assert decoded["first"] is decoded["second"]

# Complex circular structure (tree with back-references)
root = {"name": "root", "children": []}
child = {"name": "child", "parent": root}
root["children"].append(child)
encoded = encode(root)
decoded = decode(encoded)
assert decoded["children"][0]["parent"] is decoded
```

## How It Works

The library uses the [links-notation](https://github.com/link-foundation/links-notation) format as the serialization target. Each Python object is encoded as a Link with type information:

- Basic types are encoded with type markers: `(int 42)`, `(str "hello")`, `(bool True)`
- Strings are base64-encoded to handle special characters and newlines
- Collections include object IDs for reference tracking: `(list obj_0 item1 item2 ...)`
- Circular references use special `ref` links: `(ref obj_0)`

This approach allows for:
- Universal representation of object graphs
- Preservation of object identity
- Natural handling of circular references
- Human-readable (somewhat) output

## API Reference

### `encode(obj: Any) -> str`

Encode a Python object to Links Notation format.

**Parameters:**
- `obj`: The Python object to encode

**Returns:**
- String representation in Links Notation format

**Raises:**
- `TypeError`: If the object type is not supported

### `decode(notation: str) -> Any`

Decode Links Notation format to a Python object.

**Parameters:**
- `notation`: String in Links Notation format

**Returns:**
- Reconstructed Python object

### `ObjectCodec`

The main codec class that performs encoding and decoding. The module-level `encode()` and `decode()` functions use a shared instance of this class.

If you need isolated encoding contexts (for example, in multi-threaded environments), you can create your own codec instances:

```python
from link_notation_objects_codec import ObjectCodec

codec = ObjectCodec()
encoded = codec.encode({"data": [1, 2, 3]})
decoded = codec.decode(encoded)
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/link-foundation/link-notation-objects-codec.git
cd link-notation-objects-codec/python

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install in development mode
pip install -e ".[dev]"
```

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=link_notation_objects_codec --cov-report=term-missing

# Run specific test file
pytest tests/test_basic_types.py -v
```

### Code Quality

```bash
# Linting with ruff
ruff check src/ tests/

# Type checking with mypy
mypy src/
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Add tests for your changes
4. Ensure all tests pass (`pytest tests/`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the Unlicense - see the [LICENSE](../LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/link-foundation/link-notation-objects-codec)
- [Links Notation Specification](https://github.com/link-foundation/links-notation)
- [PyPI Package](https://pypi.org/project/link-notation-objects-codec/)
- [JavaScript Implementation](../js/)

## Acknowledgments

This project is built on top of the [links-notation](https://github.com/link-foundation/links-notation) library.
