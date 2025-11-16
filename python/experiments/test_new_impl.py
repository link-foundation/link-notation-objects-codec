#!/usr/bin/env python
"""Test the new implementation with self-reference format."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from link_notation_objects_codec import encode, decode

print("=" * 60)
print("Test 1: Self-referencing dict")
print("=" * 60)

obj = {}
obj["self"] = obj

encoded = encode(obj)
print(f"Encoded: {encoded}")
print(f"Expected format: (obj_0: dict ((str c2VsZg==) obj_0))")

# Decode it back
decoded = decode(encoded)
print(f"Decoded successfully: {decoded is not None}")
print(f"Has 'self' key: {'self' in decoded}")
print(f"Self-reference works: {decoded['self'] is decoded}")

print("\n" + "=" * 60)
print("Test 2: Self-referencing list")
print("=" * 60)

lst = [1, 2, 3]
lst.append(lst)

encoded2 = encode(lst)
print(f"Encoded: {encoded2}")
print(f"Expected format: (obj_0: list (int 1) (int 2) (int 3) obj_0)")

decoded2 = decode(encoded2)
print(f"Decoded successfully: {decoded2 is not None}")
print(f"Length: {len(decoded2)}")
print(f"Self-reference works: {decoded2[3] is decoded2}")

print("\n" + "=" * 60)
print("Test 3: Mutual references")
print("=" * 60)

list1 = [1, 2]
list2 = [3, 4]
list1.append(list2)
list2.append(list1)

encoded3 = encode(list1)
print(f"Encoded: {encoded3}")

decoded3 = decode(encoded3)
print(f"Decoded successfully: {decoded3 is not None}")
print(f"list1 length: {len(decoded3)}")
print(f"list2 reference: {decoded3[2]}")
print(f"Mutual ref works: {decoded3[2][2] is decoded3}")

print("\n" + "=" * 60)
print("Test 4: Simple dict (no self-reference)")
print("=" * 60)

simple = {"a": 1, "b": 2}
encoded4 = encode(simple)
print(f"Encoded: {encoded4}")
print(f"Expected format: (dict ((str ...) (int 1)) ((str ...) (int 2)))")

decoded4 = decode(encoded4)
print(f"Decoded: {decoded4}")
print(f"Matches original: {decoded4 == simple}")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
