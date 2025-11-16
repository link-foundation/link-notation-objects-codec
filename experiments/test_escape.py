"""Test escaping in links notation."""

from links_notation import Parser, Link, format_links
import base64

parser = Parser()

# Test base64 encoding
test_string = "multi\nline\tstring"
print(f"Original: {repr(test_string)}")

# Encode to base64
b64 = base64.b64encode(test_string.encode('utf-8')).decode('ascii')
print(f"Base64: {b64}")

# Create link with base64
link = Link(values=[Link(link_id="str"), Link(link_id=b64)])
formatted = format_links([link])
print(f"Formatted: {formatted}")

# Parse back
parsed = parser.parse(formatted)
if parsed and parsed[0].values:
    recovered_b64 = parsed[0].values[1].id
    print(f"Recovered base64: {recovered_b64}")
    decoded = base64.b64decode(recovered_b64).decode('utf-8')
    print(f"Decoded: {repr(decoded)}")
    print(f"Match: {decoded == test_string}")
