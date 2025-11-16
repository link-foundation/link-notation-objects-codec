#!/usr/bin/env python3
"""Quick test to verify the encoder produces the correct format."""

import sys
sys.path.insert(0, 'src')

from link_notation_objects_codec import encode, decode

# Test 1: Self-referencing list
print("Test 1: Self-referencing list")
lst = []
lst.append(lst)
encoded = encode(lst)
print(f"  Encoded: {encoded}")
print(f"  Expected: (obj_0: list obj_0)")
print(f"  Match: {encoded == '(obj_0: list obj_0)'}")
print()

# Test 2: Self-referencing dict
print("Test 2: Self-referencing dict")
d = {}
d["self"] = d
encoded = encode(d)
print(f"  Encoded: {encoded}")
print(f"  Expected: (obj_0: dict ((str c2VsZg==) obj_0))")
print(f"  Match: {encoded == '(obj_0: dict ((str c2VsZg==) obj_0))'}")
print()

# Test 3: Mutual reference lists
print("Test 3: Mutual reference lists")
list1 = [1, 2]
list2 = [3, 4]
list1.append(list2)
list2.append(list1)
encoded = encode(list1)
print(f"  Encoded: {encoded}")
print(f"  Expected: (obj_0: list (int 1) (int 2) (obj_1: list (int 3) (int 4) obj_0))")
print(f"  Match: {encoded == '(obj_0: list (int 1) (int 2) (obj_1: list (int 3) (int 4) obj_0))'}")
print()

# Test 4: Round-trip
print("Test 4: Round-trip test")
d = {}
d["self"] = d
encoded = encode(d)
decoded = decode(encoded)
print(f"  Decoded type: {type(decoded)}")
print(f"  Has 'self' key: {'self' in decoded}")
print(f"  Self-reference works: {decoded.get('self') is decoded}")
