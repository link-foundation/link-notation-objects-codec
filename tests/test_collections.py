"""Tests for encoding/decoding collection types (lists and dicts)."""

from link_notation_objects_codec import decode, encode


class TestLists:
    """Tests for list type serialization."""

    def test_encode_empty_list(self):
        """Test encoding empty list."""
        result = encode([])
        assert result is not None
        assert isinstance(result, str)

    def test_encode_simple_list(self):
        """Test encoding simple list."""
        result = encode([1, 2, 3])
        assert result is not None
        assert isinstance(result, str)

    def test_decode_empty_list(self):
        """Test decoding empty list."""
        encoded = encode([])
        result = decode(encoded)
        assert result == []
        assert type(result) == list

    def test_decode_simple_list(self):
        """Test decoding simple list."""
        encoded = encode([1, 2, 3])
        result = decode(encoded)
        assert result == [1, 2, 3]
        assert type(result) == list

    def test_roundtrip_list(self):
        """Test roundtrip encoding/decoding of lists."""
        test_values = [
            [],
            [1],
            [1, 2, 3],
            ["a", "b", "c"],
            [True, False, True],
            [None, None],
            [1, "hello", True, None],  # mixed types
        ]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value
            assert type(decoded) == list

    def test_nested_lists(self):
        """Test encoding/decoding nested lists."""
        test_values = [
            [[]],
            [[1, 2], [3, 4]],
            [[1, [2, 3]], [4, [5, 6]]],
            [[[[]]]],
            [[1, 2], ["a", "b"], [True, False]],
        ]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value


class TestDicts:
    """Tests for dict type serialization."""

    def test_encode_empty_dict(self):
        """Test encoding empty dict."""
        result = encode({})
        assert result is not None
        assert isinstance(result, str)

    def test_encode_simple_dict(self):
        """Test encoding simple dict."""
        result = encode({"a": 1, "b": 2})
        assert result is not None
        assert isinstance(result, str)

    def test_decode_empty_dict(self):
        """Test decoding empty dict."""
        encoded = encode({})
        result = decode(encoded)
        assert result == {}
        assert type(result) == dict

    def test_decode_simple_dict(self):
        """Test decoding simple dict."""
        encoded = encode({"a": 1, "b": 2})
        result = decode(encoded)
        assert result == {"a": 1, "b": 2}
        assert type(result) == dict

    def test_roundtrip_dict(self):
        """Test roundtrip encoding/decoding of dicts."""
        test_values = [
            {},
            {"a": 1},
            {"a": 1, "b": 2, "c": 3},
            {"name": "Alice", "age": 30},
            {"is_active": True, "is_admin": False},
            {"value": None},
            {"mixed": [1, "hello", True, None]},  # mixed value types
        ]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value
            assert type(decoded) == dict

    def test_nested_dicts(self):
        """Test encoding/decoding nested dicts."""
        test_values = [
            {"a": {}},
            {"a": {"b": 1}},
            {"a": {"b": {"c": 1}}},
            {"user": {"name": "Alice", "address": {"city": "NYC", "zip": "10001"}}},
        ]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value

    def test_dict_with_various_key_types(self):
        """Test encoding/decoding dicts with different key types."""
        # In JSON-like objects, keys are typically strings
        # But Python allows other immutable types as keys
        test_values = [
            {"key": "value"},
            {"123": "numeric string key"},
            {"": "empty key"},
            {"special!@#$": "special chars in key"},
        ]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value


class TestComplexStructures:
    """Tests for complex nested structures."""

    def test_list_of_dicts(self):
        """Test encoding/decoding list of dicts."""
        value = [
            {"name": "Alice", "age": 30},
            {"name": "Bob", "age": 25},
        ]
        encoded = encode(value)
        decoded = decode(encoded)
        assert decoded == value

    def test_dict_of_lists(self):
        """Test encoding/decoding dict of lists."""
        value = {
            "numbers": [1, 2, 3],
            "strings": ["a", "b", "c"],
            "mixed": [1, "hello", True],
        }
        encoded = encode(value)
        decoded = decode(encoded)
        assert decoded == value

    def test_deeply_nested_structure(self):
        """Test encoding/decoding deeply nested structures."""
        value = {
            "users": [
                {
                    "name": "Alice",
                    "contacts": {
                        "emails": ["alice@example.com", "alice2@example.com"],
                        "phones": [{"type": "mobile", "number": "555-1234"}],
                    },
                },
                {
                    "name": "Bob",
                    "contacts": {
                        "emails": ["bob@example.com"],
                        "phones": [],
                    },
                },
            ],
            "metadata": {"version": 1, "created": "2025-01-01"},
        }
        encoded = encode(value)
        decoded = decode(encoded)
        assert decoded == value

    def test_json_like_object(self):
        """Test encoding/decoding typical JSON-like object."""
        value = {
            "id": 123,
            "name": "Test Object",
            "active": True,
            "tags": ["tag1", "tag2", "tag3"],
            "metadata": {
                "created": "2025-01-01",
                "modified": None,
                "count": 42,
            },
            "items": [
                {"id": 1, "value": "first"},
                {"id": 2, "value": "second"},
            ],
        }
        encoded = encode(value)
        decoded = decode(encoded)
        assert decoded == value
