#!/usr/bin/env python
"""Debug decoder flow."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from link_notation_objects_codec.codec import ObjectCodec
from links_notation import Parser

notation = '(obj_0: dict ((str bmFtZQ==) (str ZDE=)) ((str b3RoZXI=) (obj_1: dict ((str bmFtZQ==) (str ZDI=)) ((str b3RoZXI=) obj_0))))'
print(f"Input: {notation}")

parser = Parser()
parsed = parser.parse(notation)
print(f"Parsed: {parsed}")

if parsed:
    link = parsed[0]
    print(f"\nLink details:")
    print(f"  link.id: {link.id}")
    print(f"  link.id.startswith('obj_'): {link.id.startswith('obj_') if link.id else False}")
    print(f"  link.values: {link.values}")
    if link.values:
        print(f"  link.values[0]: {link.values[0]}")
        print(f"  link.values[0].id: {link.values[0].id if hasattr(link.values[0], 'id') else 'N/A'}")

codec = ObjectCodec()
result = codec._decode_link(link)
print(f"\nDecoded result: {result}")
print(f"Type: {type(result)}")
if isinstance(result, dict):
    print(f"Keys: {list(result.keys())}")
