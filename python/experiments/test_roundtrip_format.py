#!/usr/bin/env python
"""Test roundtrip encoding/decoding with the new format."""

from links_notation import Link, Parser
import base64

def create_test_structure():
    """Create: obj = {"self": obj}"""
    # Expected output: (obj_0: dict ((str c2VsZg==) obj_0))
    # OR: (obj_0: dict obj_0 ((str c2VsZg==) obj_0))

    self_key_b64 = base64.b64encode(b'self').decode('ascii')
    print(f"'self' encoded: {self_key_b64}")

    # Format 1: WITHOUT redundant obj_0
    print("\n" + "="*60)
    print("Format 1: (obj_0: dict ((str c2VsZg==) obj_0))")
    print("="*60)

    str_key = Link(values=[Link(link_id='str'), Link(link_id=self_key_b64)])
    obj_ref = Link(link_id='obj_0')
    pair = Link(values=[str_key, obj_ref])

    dict_link1 = Link(link_id='obj_0', values=[
        Link(link_id='dict'),
        pair
    ])

    encoded1 = dict_link1.format()
    print(f"Encoded: {encoded1}")

    # Try to parse and decode
    parser = Parser()
    parsed1 = parser.parse(encoded1)
    print(f"Parsed: {parsed1[0] if parsed1 else None}")

    # Format 2: WITH redundant obj_0 (as user showed)
    print("\n" + "="*60)
    print("Format 2: (obj_0: dict obj_0 ((str c2VsZg==) obj_0))")
    print("="*60)

    dict_link2 = Link(link_id='obj_0', values=[
        Link(link_id='dict'),
        Link(link_id='obj_0'),  # Reference to self
        pair
    ])

    encoded2 = dict_link2.format()
    print(f"Encoded: {encoded2}")

    # Try to parse and decode
    parsed2 = parser.parse(encoded2)
    print(f"Parsed: {parsed2[0] if parsed2 else None}")

    # Format 3: NO dict marker, just pairs (from original issue)
    print("\n" + "="*60)
    print("Format 3: (obj_0: ((str c2VsZg==) obj_0)) - no dict marker")
    print("="*60)

    dict_link3 = Link(link_id='obj_0', values=[pair])

    encoded3 = dict_link3.format()
    print(f"Encoded: {encoded3}")

    # Try to parse and decode
    parsed3 = parser.parse(encoded3)
    print(f"Parsed: {parsed3[0] if parsed3 else None}")

if __name__ == '__main__':
    create_test_structure()
