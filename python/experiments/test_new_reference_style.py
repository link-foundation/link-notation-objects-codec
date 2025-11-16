"""
Experiment to test new reference style using built-in links notation references.

Current format:
  (dict obj_0 ((str c2VsZg==) (ref obj_0)))

New format (desired):
  (obj_0: ((str c2VsZg==) obj_0))

The key insight:
- Instead of using (ref obj_0) to reference an object
- Use the object's ID directly: obj_0
- The container should have link_id set to establish the self-reference
"""

from links_notation import Link, Parser, format_links

# Test 1: Simple self-reference using new style
print("=== Test 1: Simple self-reference ===")
# We want: (obj_0: (self obj_0))
# This means: object with ID obj_0 contains a pair (self, obj_0)

# Create the structure
obj_link = Link(
    link_id="obj_0",
    values=[
        Link(values=[
            Link(link_id="self"),
            Link(link_id="obj_0")  # Direct reference, not (ref obj_0)
        ])
    ]
)
encoded = obj_link.format()
print(f"Encoded: {encoded}")

# Try to decode it
parser = Parser()
decoded_links = parser.parse(encoded)
print(f"Decoded links: {decoded_links}")
print()

# Test 2: Complex object with self-reference and other properties
print("=== Test 2: Complex object ===")
# Desired: (obj_0: (self obj_0) (other (obj_1: (1 1) (2 2))))

inner_obj = Link(
    link_id="obj_1",
    values=[
        Link(values=[Link(link_id="1"), Link(link_id="1")]),
        Link(values=[Link(link_id="2"), Link(link_id="2")])
    ]
)

outer_obj = Link(
    link_id="obj_0",
    values=[
        Link(values=[Link(link_id="self"), Link(link_id="obj_0")]),
        Link(values=[Link(link_id="other"), inner_obj])
    ]
)

encoded2 = outer_obj.format()
print(f"Encoded: {encoded2}")

# Decode
decoded_links2 = parser.parse(encoded2)
print(f"Decoded links: {decoded_links2}")
print()

# Test 3: List with self-reference
print("=== Test 3: List with self-reference ===")
# Desired: (obj_0: obj_0)
# This means: a list with ID obj_0 that contains a reference to obj_0

list_link = Link(
    link_id="obj_0",
    values=[
        Link(link_id="obj_0")  # Direct self-reference
    ]
)

encoded3 = list_link.format()
print(f"Encoded: {encoded3}")

decoded_links3 = parser.parse(encoded3)
print(f"Decoded links: {decoded_links3}")
print()

print("=== Experiment complete ===")
print("This confirms we can use link_id on the container and direct references")
print("instead of the (ref obj_id) pattern.")
