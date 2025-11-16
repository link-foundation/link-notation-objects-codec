"""Test string encoding issues."""

from links_notation import Parser, Link, format_links

# Test encoding a string with newline
parser = Parser()

# Test how links notation handles special characters
test_strings = [
    "hello",
    "hello world",
    "multi\nline",
    '"quoted"',
    "string with 'quotes'",
]

for s in test_strings:
    print(f"\n=== Testing: {repr(s)} ===")
    # Try creating a link with this string
    try:
        link = Link(link_id=s)
        formatted = format_links([link])
        print(f"Formatted: {formatted}")
        parsed = parser.parse(formatted)
        if parsed:
            print(f"Parsed: {parsed[0]}")
            if parsed[0].id:
                print(f"Got id: {repr(parsed[0].id)}")
            if parsed[0].values:
                print(f"Got values: {parsed[0].values}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

# Test how to properly escape strings in links notation
print("\n\n=== Testing quoted strings ===")
test_link = Link(values=[Link(link_id="str"), Link(link_id='"hello"')])
print(f"Link: {test_link}")
formatted = format_links([test_link])
print(f"Formatted: {formatted}")
parsed = parser.parse(formatted)
if parsed:
    print(f"Parsed: {parsed[0]}")
    if parsed[0].values:
        for i, v in enumerate(parsed[0].values):
            print(f"  Value {i}: {v} (id={repr(v.id)})")
