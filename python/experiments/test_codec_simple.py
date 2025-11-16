"""Simple test of codec implementation."""

from link_notation_objects_codec import encode, decode

# Test basic types
print("=== Testing None ===")
try:
    encoded = encode(None)
    print(f"Encoded: {encoded}")
    decoded = decode(encoded)
    print(f"Decoded: {decoded}")
    print(f"Match: {decoded is None}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing bool ===")
try:
    encoded = encode(True)
    print(f"Encoded: {encoded}")
    decoded = decode(encoded)
    print(f"Decoded: {decoded}")
    print(f"Match: {decoded == True}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing int ===")
try:
    encoded = encode(42)
    print(f"Encoded: {encoded}")
    decoded = decode(encoded)
    print(f"Decoded: {decoded}")
    print(f"Match: {decoded == 42}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing str ===")
try:
    encoded = encode("hello")
    print(f"Encoded: {encoded}")
    decoded = decode(encoded)
    print(f"Decoded: {decoded}")
    print(f"Match: {decoded == 'hello'}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing list ===")
try:
    encoded = encode([1, 2, 3])
    print(f"Encoded: {encoded}")
    decoded = decode(encoded)
    print(f"Decoded: {decoded}")
    print(f"Match: {decoded == [1, 2, 3]}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
