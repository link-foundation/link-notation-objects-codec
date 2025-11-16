"""Tests for encoding/decoding objects with circular references."""

import pytest
from link_notation_objects_codec import encode, decode


class TestCircularReferences:
    """Tests for circular reference handling."""

    def test_self_referencing_list(self):
        """Test encoding/decoding a list that references itself."""
        lst = []
        lst.append(lst)

        encoded = encode(lst)
        decoded = decode(encoded)

        # Check that it's a list containing itself
        assert type(decoded) == list
        assert len(decoded) == 1
        assert decoded[0] is decoded

    def test_self_referencing_dict(self):
        """Test encoding/decoding a dict that references itself."""
        d = {}
        d["self"] = d

        encoded = encode(d)
        decoded = decode(encoded)

        # Check that it's a dict containing itself
        assert type(decoded) == dict
        assert "self" in decoded
        assert decoded["self"] is decoded

    def test_mutual_reference_lists(self):
        """Test encoding/decoding two lists referencing each other."""
        list1 = [1, 2]
        list2 = [3, 4]
        list1.append(list2)
        list2.append(list1)

        encoded = encode(list1)
        decoded = decode(encoded)

        # Check the structure
        assert len(decoded) == 3
        assert decoded[0] == 1
        assert decoded[1] == 2
        assert type(decoded[2]) == list
        assert len(decoded[2]) == 3
        assert decoded[2][0] == 3
        assert decoded[2][1] == 4
        # Check circular reference
        assert decoded[2][2] is decoded

    def test_mutual_reference_dicts(self):
        """Test encoding/decoding two dicts referencing each other."""
        dict1 = {"name": "dict1"}
        dict2 = {"name": "dict2"}
        dict1["other"] = dict2
        dict2["other"] = dict1

        encoded = encode(dict1)
        decoded = decode(encoded)

        # Check the structure
        assert decoded["name"] == "dict1"
        assert decoded["other"]["name"] == "dict2"
        # Check circular reference
        assert decoded["other"]["other"] is decoded

    def test_complex_circular_structure(self):
        """Test encoding/decoding complex structure with circular references."""
        # Create a tree-like structure with a back reference
        root = {"name": "root", "children": []}
        child1 = {"name": "child1", "parent": root}
        child2 = {"name": "child2", "parent": root}
        root["children"] = [child1, child2]

        encoded = encode(root)
        decoded = decode(encoded)

        # Check the structure
        assert decoded["name"] == "root"
        assert len(decoded["children"]) == 2
        assert decoded["children"][0]["name"] == "child1"
        assert decoded["children"][1]["name"] == "child2"
        # Check circular references
        assert decoded["children"][0]["parent"] is decoded
        assert decoded["children"][1]["parent"] is decoded

    def test_list_with_multiple_references_to_same_object(self):
        """Test encoding/decoding list with multiple references to same object."""
        shared = {"shared": "value"}
        lst = [shared, shared, shared]

        encoded = encode(lst)
        decoded = decode(encoded)

        # Check that all three items reference the same object
        assert len(decoded) == 3
        assert decoded[0] is decoded[1]
        assert decoded[1] is decoded[2]
        assert decoded[0] == {"shared": "value"}

    def test_dict_with_multiple_references_to_same_object(self):
        """Test encoding/decoding dict with multiple references to same object."""
        shared = ["shared", "list"]
        d = {"first": shared, "second": shared, "third": shared}

        encoded = encode(d)
        decoded = decode(encoded)

        # Check that all three values reference the same object
        assert decoded["first"] is decoded["second"]
        assert decoded["second"] is decoded["third"]
        assert decoded["first"] == ["shared", "list"]

    def test_deeply_nested_circular_reference(self):
        """Test encoding/decoding deeply nested structure with circular reference."""
        level1 = {"level": 1}
        level2 = {"level": 2, "parent": level1}
        level3 = {"level": 3, "parent": level2}
        level4 = {"level": 4, "parent": level3}
        level1["child"] = level2
        level2["child"] = level3
        level3["child"] = level4
        # Create circular reference
        level4["root"] = level1

        encoded = encode(level1)
        decoded = decode(encoded)

        # Navigate down the structure
        assert decoded["level"] == 1
        assert decoded["child"]["level"] == 2
        assert decoded["child"]["child"]["level"] == 3
        assert decoded["child"]["child"]["child"]["level"] == 4
        # Check circular reference back to root
        assert decoded["child"]["child"]["child"]["root"] is decoded
