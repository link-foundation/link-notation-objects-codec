"""Test if round-trip works despite parser oddity."""

from link_notation_objects_codec import encode, decode

# Simple case that should work
print("=== Test 1: List with self-reference ===")
lst = []
lst.append(lst)

encoded = encode(lst)
print(f"Encoded: {encoded}")

decoded = decode(encoded)
print(f"Decoded: {decoded}")
print(f"Self-reference works: {decoded[0] is decoded}")
print()

# Dict with only self-reference (no nested objects with IDs)
print("=== Test 2: Dict with self-reference and simple values ===")
obj = {}
obj["self"] = obj
obj["num"] = 42
obj["text"] = "hello"

encoded2 = encode(obj)
print(f"Encoded: {encoded2}")

try:
    decoded2 = decode(encoded2)
    print(f"Decoded: {decoded2}")
    print(f"Keys: {list(decoded2.keys())}")
    print(f"Self-reference works: {decoded2['self'] is decoded2}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
