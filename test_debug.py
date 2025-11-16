#!/usr/bin/env python3
import sys
sys.path.insert(0, 'python/src')

from link_notation_objects_codec import encode, decode

# Test mutual reference dicts
dict1 = {"name": "dict1"}
dict2 = {"name": "dict2"}
dict1["other"] = dict2
dict2["other"] = dict1

print("=== Encoding ===")
encoded = encode(dict1)
print(f"Encoded:\n{encoded}")
print()

print("=== Decoding ===")
try:
    decoded = decode(encoded)
    print(f"Decoded: {decoded}")
    print(f"decoded['name']: {decoded.get('name', 'MISSING')}")
    print(f"'other' in decoded: {'other' in decoded}")
    if 'other' in decoded:
        print(f"decoded['other']: {decoded['other']}")
except Exception as e:
    print(f"Error during decoding: {e}")
    import traceback
    traceback.print_exc()
