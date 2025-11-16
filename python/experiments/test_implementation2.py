"""Test the new implementation - corrected version."""

from link_notation_objects_codec import encode, decode

print("=== Test 1: Simple self-reference (dict) ===")
obj = {}
obj["self"] = obj
obj["other"] = {"1": 1, "2": 2}

encoded = encode(obj)
print(f"Encoded: {encoded}")

decoded = decode(encoded)
print(f"Decoded successfully")
print(f"Has 'self' key: {'self' in decoded}")
print(f"Has 'other' key: {'other' in decoded}")
print(f"Self-reference works: {decoded['self'] is decoded}")
print(f"Other value: {decoded['other']}")
print()

print("=== Test 2: Simple self-reference (list) ===")
lst = []
lst.append(lst)

encoded2 = encode(lst)
print(f"Encoded: {encoded2}")

decoded2 = decode(encoded2)
print(f"Decoded successfully")
print(f"List length: {len(decoded2)}")
print(f"Self-reference works: {decoded2[0] is decoded2}")
print()

print("=== Test 3: Mutual references ===")
list1 = [1, 2]
list2 = [3, 4]
list1.append(list2)
list2.append(list1)

encoded3 = encode(list1)
print(f"Encoded: {encoded3}")

decoded3 = decode(encoded3)
print(f"Decoded successfully")
print(f"Type: {type(decoded3)}")
print(f"List1 length: {len(decoded3)}")
print(f"List1[0]: {decoded3[0]}")
print(f"List1[1]: {decoded3[1]}")
print(f"List1[2] (nested list): {decoded3[2]}")
print(f"List1[2] length: {len(decoded3[2])}")
print(f"Mutual reference works: {decoded3[2][2] is decoded3}")
print()

print("=== Test 4: Dict as mentioned in issue ===")
obj2 = {}
obj2["self"] = obj2
obj2["other"] = {"1": 1, "2": 2}

encoded4 = encode(obj2)
print(f"Encoded: {encoded4}")
print()
print("Expected format similar to: (obj: (self obj) (other ((1 1) (2 2))))")
print()

decoded4 = decode(encoded4)
print(f"Decoded: keys={list(decoded4.keys())}, self_ref={decoded4['self'] is decoded4}")
