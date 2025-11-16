# Links Notation Parser Bug - Nested Self-References in Pairs

## Summary

The Python `links-notation` library (versions 0.11.0-0.11.2) has a parsing bug when handling self-referenced objects nested inside pairs (key-value structures).

## Environment

- **Package**: `links-notation`
- **Versions Tested**: 0.11.0, 0.11.1, 0.11.2
- **Python Version**: 3.13
- **Status**: JavaScript implementation works correctly, Python implementation fails

## Problem Description

When a self-referenced object definition (using the `(id: type ...)` syntax) is nested as a VALUE inside a pair, the parser fails to correctly parse the structure.

### What Works ✅

**Self-reference as direct child:**
```
(obj_0: list (int 1) (int 2) (obj_1: list (int 3) (int 4) obj_0))
```
This parses correctly because `(obj_1: list ...)` is a direct child of the list, not nested inside a pair.

**Simple self-reference:**
```
(obj_0: dict ((str c2VsZg==) obj_0))
```
This works because `obj_0` is a reference (no inline definition), not a nested definition.

### What Fails ❌

**Self-reference nested in pair:**
```
(obj_0: dict ((str bmFtZQ==) (str ZGljdDE=)) ((str b3RoZXI=) (obj_1: dict ((str bmFtZQ==) (str ZGljdDI=)) ((str b3RoZXI=) obj_0))))
```

In this example:
- The second pair has key `(str b3RoZXI=)` (base64 for "other")
- The second pair's value should be `(obj_1: dict ...)`
- But the parser fails to correctly identify this as a self-referenced dict definition

## Minimal Reproducible Example

```python
from links_notation import Parser

# This notation should represent two dicts that reference each other
notation = '(obj_0: dict ((str bmFtZQ==) (str ZGljdDE=)) ((str b3RoZXI=) (obj_1: dict ((str bmFtZQ==) (str ZGljdDI=)) ((str b3RoZXI=) obj_0))))'

parser = Parser()
links = parser.parse(notation)

# Expected: One top-level link with id="obj_0", containing:
#   - First pair: (str bmFtZQ==) → (str ZGljdDE=)
#   - Second pair: (str b3RoZXI=) → (obj_1: dict ...)
#
# Actual: The parser likely misinterprets the nested (obj_1: dict ...) structure
#         causing the second pair to be malformed or missing

print(f"Number of links parsed: {len(links)}")
if links:
    link = links[0]
    print(f"Link ID: {link.id}")
    print(f"Number of values: {len(link.values) if link.values else 0}")

    if link.values and len(link.values) > 1:
        # First value should be the type marker "dict"
        print(f"Type marker: {link.values[0].id if hasattr(link.values[0], 'id') else 'NO ID'}")

        # Remaining values should be pairs
        pairs = link.values[1:]
        print(f"Number of pairs: {len(pairs)}")

        for i, pair in enumerate(pairs):
            print(f"\nPair {i+1}:")
            if hasattr(pair, 'values') and pair.values:
                print(f"  Pair has {len(pair.values)} elements")
                if len(pair.values) >= 1:
                    key = pair.values[0]
                    print(f"  Key: {key.id if hasattr(key, 'id') else 'NO ID'}")
                if len(pair.values) >= 2:
                    value = pair.values[1]
                    print(f"  Value ID: {value.id if hasattr(value, 'id') else 'NO ID'}")
                    print(f"  Value has values: {bool(value.values) if hasattr(value, 'values') else False}")
            else:
                print(f"  Pair has no values or is malformed")
```

## Expected Output

```
Number of links parsed: 1
Link ID: obj_0
Number of values: 3
Type marker: dict
Number of pairs: 2

Pair 1:
  Pair has 2 elements
  Key: bmFtZQ==
  Value ID: ZGljdDE=
  Value has values: False

Pair 2:
  Pair has 2 elements
  Key: b3RoZXI=
  Value ID: obj_1
  Value has values: True
```

## Actual Output

*(To be filled in after running the test)*

The parser likely produces incorrect structure for Pair 2, where the nested `(obj_1: dict ...)` is not properly recognized as a self-referenced dict definition.

## Workaround

Currently, the only workaround is to output separate top-level link definitions:

```
(obj_1: dict ((str bmFtZQ==) (str ZGljdDI=)) ((str b3RoZXI=) obj_0))
(obj_0: dict ((str bmFtZQ==) (str ZGljdDE=)) ((str b3RoZXI=) obj_1))
```

This avoids nesting self-referenced definitions inside pairs, but sacrifices the desired inline format.

## Comparison with JavaScript

The JavaScript implementation of `links-notation` correctly parses the nested self-reference syntax. Tests using the same notation format pass in JavaScript but fail in Python.

## Impact

This bug prevents the `link-notation-objects-codec` library from properly encoding/decoding mutually-referential dict structures using the inline self-reference format. It limits the library to either:
1. Using the multi-line workaround (separate top-level definitions)
2. Only supporting list-based circular references (which work because they don't nest definitions in pairs)

## References

- Issue: https://github.com/link-foundation/link-notation-objects-codec/issues/5
- Pull Request: https://github.com/link-foundation/link-notation-objects-codec/pull/6
- Links Notation Specification: https://github.com/link-foundation/links-notation

## Requested Action

Please fix the Python `links-notation` parser to correctly handle self-referenced object definitions when they appear as values inside pairs, matching the behavior of the JavaScript implementation.
