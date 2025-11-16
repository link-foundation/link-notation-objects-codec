"""Test shared object references."""

from link_notation_objects_codec import encode, decode

print("=== Test: List with shared object ===")
shared = {"shared": "value"}
lst = [shared, shared, shared]

print(f"Original list: {lst}")
print(f"All same object: {lst[0] is lst[1] is lst[2]}")

encoded = encode(lst)
print(f"\nEncoded: {encoded}")

decoded = decode(encoded)
print(f"\nDecoded: {decoded}")
print(f"Decoded type: {type(decoded)}")
print(f"Decoded length: {len(decoded)}")

if isinstance(decoded, list) and len(decoded) > 0:
    print(f"First item type: {type(decoded[0])}")
    print(f"First item: {decoded[0]}")
    if len(decoded) > 1:
        print(f"All same object: {decoded[0] is decoded[1] is decoded[2] if len(decoded) > 2 else 'N/A'}")
