"""Test mutual reference dicts."""

from link_notation_objects_codec import encode

dict1 = {"name": "dict1"}
dict2 = {"name": "dict2"}
dict1["other"] = dict2
dict2["other"] = dict1

encoded = encode(dict1)
print(f"Encoded: {encoded}")

# Parse it to see the structure
from links_notation import Parser
parser = Parser()
links = parser.parse(encoded)

if links:
    link = links[0]
    print(f"\nLink ID: '{link.id}'")
    print(f"Number of values: {len(link.values)}")

    for i, val in enumerate(link.values):
        print(f"\nValue {i}:")
        print(f"  ID: '{val.id}'")
        print(f"  Values: {len(val.values) if hasattr(val, 'values') else 0}")

        if hasattr(val, 'values') and val.values:
            for j, subval in enumerate(val.values):
                print(f"    Subvalue {j}: ID='{subval.id}'")
