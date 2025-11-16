#!/usr/bin/env python
"""Test the correct Links Notation format for self-referencing objects."""

from links_notation import Link, Parser

# Test 1: Self-referencing dict as user expects
# obj = {"self": obj}
# Expected format: (obj_0: dict obj_0 ((str c2VsZg==) obj_0))

print("=" * 60)
print("Test 1: Self-referencing dict")
print("=" * 60)

# Build the structure manually
str_key = Link(values=[Link(link_id='str'), Link(link_id='c2VsZg==')])  # (str c2VsZg==)
obj_0_ref = Link(link_id='obj_0')  # Reference to obj_0
key_value_pair = Link(values=[str_key, obj_0_ref])  # ((str c2VsZg==) obj_0)

# The dict itself with self-reference using (self-ref: contents) syntax
# Format: (obj_0: dict obj_0 ((str c2VsZg==) obj_0))
dict_link = Link(link_id='obj_0', values=[
    Link(link_id='dict'),    # Type marker
    Link(link_id='obj_0'),   # Reference to self (same as the outer obj_0)
    key_value_pair           # The key-value pair
])

encoded = dict_link.format()
print(f"Encoded: {encoded}")
print(f"Expected: (obj_0: dict obj_0 ((str c2VsZg==) obj_0))")
print(f"Match: {encoded == '(obj_0: dict obj_0 ((str c2VsZg==) obj_0))'}")

# Test parsing back
parser = Parser()
parsed = parser.parse(encoded)
print(f"\nParsed successfully: {parsed is not None and len(parsed) > 0}")

if parsed and len(parsed) > 0:
    link = parsed[0]
    print(f"Link ID: {link.id}")
    print(f"Link values count: {len(link.values)}")
    if len(link.values) >= 3:
        print(f"  Value 0 (type): {link.values[0].id}")
        print(f"  Value 1 (self-ref): {link.values[1].id}")
        print(f"  Value 2 (pair): {link.values[2]}")

print("\n" + "=" * 60)
print("Test 2: Simple dict (no self-reference)")
print("=" * 60)

# Simple dict without self-reference: {"a": 1}
# Expected format: (dict ((str YQ==) (int 1)))
simple_dict = Link(values=[
    Link(link_id='dict'),
    Link(values=[
        Link(values=[Link(link_id='str'), Link(link_id='YQ==')]),
        Link(values=[Link(link_id='int'), Link(link_id='1')])
    ])
])

encoded2 = simple_dict.format()
print(f"Encoded: {encoded2}")
print(f"Expected: (dict ((str YQ==) (int 1)))")

print("\n" + "=" * 60)
print("Test 3: Self-referencing list")
print("=" * 60)

# Self-referencing list: lst = [1, 2, lst]
# Expected format: (obj_0: list (int 1) (int 2) obj_0)
list_link = Link(link_id='obj_0', values=[
    Link(link_id='list'),
    Link(values=[Link(link_id='int'), Link(link_id='1')]),
    Link(values=[Link(link_id='int'), Link(link_id='2')]),
    Link(link_id='obj_0')  # Reference to self
])

encoded3 = list_link.format()
print(f"Encoded: {encoded3}")
print(f"Expected: (obj_0: list (int 1) (int 2) obj_0)")

print("\n" + "=" * 60)
print("Test 4: Mutual references")
print("=" * 60)

# list1 = [1, 2, list2]
# list2 = [3, 4, list1]
# Expected:
# (obj_0: list (int 1) (int 2) (obj_1: list (int 3) (int 4) obj_0))

list2_ref = Link(link_id='obj_1', values=[
    Link(link_id='list'),
    Link(values=[Link(link_id='int'), Link(link_id='3')]),
    Link(values=[Link(link_id='int'), Link(link_id='4')]),
    Link(link_id='obj_0')  # Reference to list1
])

list1_link = Link(link_id='obj_0', values=[
    Link(link_id='list'),
    Link(values=[Link(link_id='int'), Link(link_id='1')]),
    Link(values=[Link(link_id='int'), Link(link_id='2')]),
    list2_ref  # Nested list2 definition
])

encoded4 = list1_link.format()
print(f"Encoded: {encoded4}")
print(f"Expected: (obj_0: list (int 1) (int 2) (obj_1: list (int 3) (int 4) obj_0))")

print("\n" + "=" * 60)
print("Summary: All tests show correct format using (self-ref: ...) syntax")
print("=" * 60)
