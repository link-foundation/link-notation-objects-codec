"""Test the new implementation."""

from link_notation_objects_codec import encode, decode

print("=== Test 1: Simple self-reference (dict) ===")
obj = {}
obj["self"] = obj
obj["other"] = {"1": 1, "2": 2}

encoded = encode(obj)
print(f"Encoded: {encoded}")

try:
    decoded = decode(encoded)
    print(f"Decoded successfully")
    print(f"Has 'self' key: {'self' in decoded}")
    print(f"Has 'other' key: {'other' in decoded}")
    print(f"Self-reference works: {decoded['self'] is decoded}")
    print(f"Other value: {decoded['other']}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

print()
print("=== Test 2: Simple self-reference (list) ===")
lst = []
lst.append(lst)

encoded2 = encode(lst)
print(f"Encoded: {encoded2}")

try:
    decoded2 = decode(encoded2)
    print(f"Decoded successfully")
    print(f"List length: {len(decoded2)}")
    print(f"Self-reference works: {decoded2[0] is decoded2}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

print()
print("=== Test 3: Mutual references ===")
list1 = [1, 2]
list2 = [3, 4]
list1.append(list2)
list2.append(list1)

encoded3 = encode(list1)
print(f"Encoded: {encoded3}")

try:
    decoded3 = decode(encoded3)
    print(f"Decoded successfully")
    print(f"List1 length: {len(decoded3)}")
    print(f"List1[2] length: {len(decoded3[2])}")
    print(f"Mutual reference works: {decoded3[2][2] is decoded3}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
