#!/usr/bin/env python3
"""Debug decoder issue."""

import sys
sys.path.insert(0, 'src')

from links_notation import Parser

# Test parsing the encoded string
parser = Parser()
encoded = "(obj_0: dict ((str bmFtZQ==) (str ZGljdDE=)) ((str b3RoZXI=) (obj_1: dict ((str bmFtZQ==) (str ZGljdDI=)) ((str b3RoZXI=) obj_0))))"

print("Parsing:", encoded)
links = parser.parse(encoded)
print(f"Number of links: {len(links)}")

def print_link(link, indent=0):
    prefix = "  " * indent
    print(f"{prefix}Link:")
    print(f"{prefix}  id: {link.id if hasattr(link, 'id') else 'N/A'}")
    print(f"{prefix}  values: {len(link.values) if hasattr(link, 'values') and link.values else 0}")
    if hasattr(link, 'values') and link.values:
        for i, val in enumerate(link.values):
            print(f"{prefix}  value[{i}]:")
            if hasattr(val, 'id') or hasattr(val, 'values'):
                print_link(val, indent + 2)
            else:
                print(f"{prefix}    {val}")

for i, link in enumerate(links):
    print(f"\n--- Link {i} ---")
    print_link(link)
