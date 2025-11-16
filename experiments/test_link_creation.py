"""Test Link creation."""

from links_notation import Link, format_links

# Try creating links correctly
print("=== Creating simple link ===")
link1 = Link(link_id="hello")
print(f"Link: {link1}")
print(f"Formatted: {format_links([link1])}")

print("\n=== Creating link with values ===")
val1 = Link(link_id="type")
val2 = Link(link_id="value")
link2 = Link(values=[val1, val2])
print(f"Link: {link2}")
print(f"Formatted: {format_links([link2])}")

print("\n=== Creating link with id and values ===")
link3 = Link(link_id="myid", values=[val1, val2])
print(f"Link: {link3}")
print(f"Formatted: {format_links([link3])}")
