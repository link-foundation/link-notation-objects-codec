"""Debug the decoding issue."""

from links_notation import Parser

# Parse the encoded string
encoded = "(obj_0: ((str c2VsZg==) obj_0) ((str b3RoZXI=) (obj_1: ((str MQ==) (int 1)) ((str Mg==) (int 2)))))"
parser = Parser()
links = parser.parse(encoded)

print(f"Parsed links: {links}")
print()

if links:
    link = links[0]
    print(f"Link ID: {link.id}")
    print(f"Link values count: {len(link.values)}")
    print()

    for i, val in enumerate(link.values):
        print(f"Value {i}:")
        print(f"  id: {val.id}")
        print(f"  values: {val.values}")
        if val.values:
            for j, subval in enumerate(val.values):
                print(f"    Subvalue {j}: id={subval.id}, has_values={bool(subval.values)}")
                if subval.values:
                    for k, subsubval in enumerate(subval.values):
                        print(f"      Subsubvalue {k}: id={subsubval.id}")
        print()
