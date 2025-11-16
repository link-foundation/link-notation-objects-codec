#!/usr/bin/env python3
"""Test the failing cases to understand the issue."""

import sys
sys.path.insert(0, 'src')

from link_notation_objects_codec import encode, decode

# Test 1: Mutual reference dicts
print("Test 1: Mutual reference dicts")
dict1 = {"name": "dict1"}
dict2 = {"name": "dict2"}
dict1["other"] = dict2
dict2["other"] = dict1

encoded = encode(dict1)
print(f"  Encoded: {encoded}")
decoded = decode(encoded)
print(f"  Decoded: {decoded}")
print(f"  Has 'name': {'name' in decoded}")
print(f"  Has 'other': {'other' in decoded}")
if 'other' in decoded:
    print(f"  decoded['other']: {decoded['other']}")
print()

# Test 2: List with multiple references to same object
print("Test 2: List with multiple references to same object")
shared = {"shared": "value"}
lst = [shared, shared, shared]

encoded = encode(lst)
print(f"  Encoded: {encoded}")
decoded = decode(encoded)
print(f"  Decoded type: {type(decoded)}")
print(f"  Decoded: {decoded}")
print(f"  Length: {len(decoded)}")
