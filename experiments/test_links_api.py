"""Experiment to understand the links-notation API."""

from links_notation import Parser, Link, format_links

# Test how to create links properly
parser = Parser()

# Test parsing simple expressions
print("=== Testing parsing ===")
result1 = parser.parse("hello")
print(f"parse('hello'): {result1}")
if result1:
    print(f"  First link: {result1[0]}")
    print(f"  Link id: {result1[0].id}")
    print(f"  Link values: {result1[0].values}")
    print(f"  Link type: {type(result1[0])}")
    print(f"  Formatted: {format_links(result1)}")

print("\n=== Testing two-element links ===")
result2 = parser.parse("(type value)")
print(f"parse('(type value)'): {result2}")
if result2:
    print(f"  First link: {result2[0]}")
    print(f"  Link id: {result2[0].id}")
    print(f"  Link values: {result2[0].values}")
    if result2[0].values:
        print(f"  First value type: {type(result2[0].values[0])}")
        if hasattr(result2[0].values[0], 'id'):
            print(f"  First value id: {result2[0].values[0].id}")
        if hasattr(result2[0].values[0], 'values'):
            print(f"  First value values: {result2[0].values[0].values}")
    print(f"  Formatted: {format_links(result2)}")

print("\n=== Testing Link construction ===")
try:
    # Try creating a link with string values
    link1 = Link(values=["type", "value"])
    print(f"Link with string values: {link1}")
    print(f"  Formatted: {format_links([link1])}")
except Exception as e:
    print(f"Error with string values: {e}")

try:
    # Try creating nested links
    inner = Link(id="inner")
    outer = Link(values=[inner])
    print(f"Link with Link values: {outer}")
    print(f"  Formatted: {format_links([outer])}")
except Exception as e:
    print(f"Error with Link values: {e}")

print("\n=== Testing id and values ===")
result3 = parser.parse("(id: type value)")
print(f"parse('(id: type value)'): {result3}")
if result3:
    print(f"  First link: {result3[0]}")
    print(f"  Link id: {result3[0].id}")
    print(f"  Link values: {result3[0].values}")
    print(f"  Formatted: {format_links(result3)}")

print("\n=== Testing nested structures ===")
result4 = parser.parse("(outer (inner1 val1) (inner2 val2))")
print(f"parse('(outer (inner1 val1) (inner2 val2))'): {result4}")
if result4:
    print(f"  First link: {result4[0]}")
    print(f"  Link id: {result4[0].id}")
    print(f"  Link values: {result4[0].values}")
    print(f"  Number of values: {len(result4[0].values)}")
    for i, val in enumerate(result4[0].values):
        print(f"  Value {i}: {val} (type: {type(val).__name__})")
        if hasattr(val, 'id'):
            print(f"    id: {val.id}")
        if hasattr(val, 'values'):
            print(f"    values: {val.values}")
    print(f"  Formatted: {format_links(result4)}")
