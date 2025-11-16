#!/usr/bin/env python3
"""Test the updated encoder implementation."""

import sys
sys.path.insert(0, 'src')

from link_notation_objects_codec import encode, decode

# Test 1: Simple self-reference
print("Test 1: Simple self-reference")
obj = {}
obj["self"] = obj
encoded = encode(obj)
print(f"  Encoded: {encoded}")
print(f"  Lines: {len(encoded.split(chr(10)))}")
decoded = decode(encoded)
print(f"  Decoded correctly: {decoded is decoded.get('self')}")
print()

# Test 2: Mutual reference dicts
print("Test 2: Mutual reference dicts")
dict1 = {"name": "dict1"}
dict2 = {"name": "dict2"}
dict1["other"] = dict2
dict2["other"] = dict1

encoded = encode(dict1)
print(f"  Encoded:\n{encoded}")
print(f"  Lines: {len(encoded.split(chr(10)))}")
decoded = decode(encoded)
print(f"  Decoded has 'name': {'name' in decoded}")
print(f"  Decoded has 'other': {'other' in decoded}")
if 'other' in decoded and 'other' in decoded['other']:
    print(f"  Circular ref works: {decoded['other']['other'] is decoded}")
print()

# Test 3: List with multiple references to same object
print("Test 3: List with multiple references to same object")
shared = {"shared": "value"}
lst = [shared, shared, shared]

encoded = encode(lst)
print(f"  Encoded:\n{encoded}")
print(f"  Lines: {len(encoded.split(chr(10)))}")
decoded = decode(encoded)
print(f"  Decoded type: {type(decoded)}")
print(f"  Length: {len(decoded)}")
if len(decoded) == 3:
    print(f"  All three are same object: {decoded[0] is decoded[1] is decoded[2]}")
print()

# Test 4: Complex circular structure
print("Test 4: Complex circular structure")
root = {"name": "root", "children": []}
child1 = {"name": "child1", "parent": root}
child2 = {"name": "child2", "parent": root}
root["children"].extend([child1, child2])

encoded = encode(root)
print(f"  Encoded:\n{encoded}")
print(f"  Lines: {len(encoded.split(chr(10)))}")
decoded = decode(encoded)
print(f"  Decoded has 'children': {'children' in decoded}")
if 'children' in decoded and len(decoded['children']) > 0:
    print(f"  Children count: {len(decoded['children'])}")
    if 'parent' in decoded['children'][0]:
        print(f"  Circular ref works: {decoded['children'][0]['parent'] is decoded}")
