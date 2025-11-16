"""
Refining the new reference style experiment.

The issue with Test 2 is that nested objects with link_id need to be wrapped
in their own Link structure properly.
"""

from links_notation import Link, Parser

# Test: Complex object with proper nesting
print("=== Test: Proper nesting ===")
# Desired format for: obj = {"self": obj, "other": {"1": 1, "2": 2}}
# (obj_0: (self obj_0) (other (1 1) (2 2)))
# BUT if "other" is a separate object that might be shared, it needs its own ID

# For now, let's just test the simpler case:
# obj = {"self": obj, "num": 42}
# Desired: (obj_0: (self obj_0) (num 42))

obj_link = Link(
    link_id="obj_0",
    values=[
        # (self obj_0)
        Link(values=[Link(link_id="self"), Link(link_id="obj_0")]),
        # (num 42)
        Link(values=[Link(link_id="num"), Link(link_id="42")])
    ]
)

encoded = obj_link.format()
print(f"Encoded: {encoded}")

parser = Parser()
decoded = parser.parse(encoded)
print(f"Decoded: {decoded}")
print()

# Understanding the Link structure
print("=== Understanding Link structure ===")
if decoded:
    link = decoded[0]
    print(f"Link ID: {link.id}")
    print(f"Link values: {link.values}")
    for i, val in enumerate(link.values):
        print(f"  Value {i}: id={val.id}, values={val.values}")
        if val.values:
            for j, subval in enumerate(val.values):
                print(f"    Subvalue {j}: id={subval.id}")
