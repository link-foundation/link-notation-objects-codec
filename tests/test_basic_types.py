"""Tests for encoding/decoding basic Python types."""

import pytest

from link_notation_objects_codec import decode, encode


class TestNoneType:
    """Tests for None type serialization."""

    def test_encode_none(self):
        """Test encoding None value."""
        result = encode(None)
        assert result is not None
        assert isinstance(result, str)

    def test_decode_none(self):
        """Test decoding None value."""
        encoded = encode(None)
        result = decode(encoded)
        assert result is None

    def test_roundtrip_none(self):
        """Test roundtrip encoding/decoding of None."""
        original = None
        encoded = encode(original)
        decoded = decode(encoded)
        assert decoded == original


class TestBooleans:
    """Tests for boolean type serialization."""

    def test_encode_true(self):
        """Test encoding True value."""
        result = encode(True)
        assert result is not None
        assert isinstance(result, str)

    def test_encode_false(self):
        """Test encoding False value."""
        result = encode(False)
        assert result is not None
        assert isinstance(result, str)

    def test_decode_true(self):
        """Test decoding True value."""
        encoded = encode(True)
        result = decode(encoded)
        assert result is True

    def test_decode_false(self):
        """Test decoding False value."""
        encoded = encode(False)
        result = decode(encoded)
        assert result is False

    def test_roundtrip_bool(self):
        """Test roundtrip encoding/decoding of boolean values."""
        for value in [True, False]:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value
            assert type(decoded) == type(value)


class TestIntegers:
    """Tests for integer type serialization."""

    def test_encode_zero(self):
        """Test encoding zero."""
        result = encode(0)
        assert result is not None
        assert isinstance(result, str)

    def test_encode_positive_int(self):
        """Test encoding positive integer."""
        result = encode(42)
        assert result is not None
        assert isinstance(result, str)

    def test_encode_negative_int(self):
        """Test encoding negative integer."""
        result = encode(-42)
        assert result is not None
        assert isinstance(result, str)

    def test_decode_int(self):
        """Test decoding integer value."""
        for value in [0, 42, -42, 999999]:
            encoded = encode(value)
            result = decode(encoded)
            assert result == value
            assert type(result) == int

    def test_roundtrip_int(self):
        """Test roundtrip encoding/decoding of integers."""
        test_values = [0, 1, -1, 42, -42, 123456789, -123456789]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value
            assert type(decoded) == int


class TestFloats:
    """Tests for float type serialization."""

    def test_encode_float(self):
        """Test encoding float value."""
        result = encode(3.14)
        assert result is not None
        assert isinstance(result, str)

    def test_decode_float(self):
        """Test decoding float value."""
        encoded = encode(3.14)
        result = decode(encoded)
        assert result == pytest.approx(3.14)
        assert type(result) == float

    def test_roundtrip_float(self):
        """Test roundtrip encoding/decoding of floats."""
        test_values = [0.0, 1.0, -1.0, 3.14, -3.14, 0.123456789, -999.999]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == pytest.approx(value)
            assert type(decoded) == float

    def test_float_special_values(self):
        """Test encoding/decoding special float values."""
        import math
        # Test infinity
        inf_encoded = encode(math.inf)
        assert decode(inf_encoded) == math.inf

        # Test negative infinity
        neg_inf_encoded = encode(-math.inf)
        assert decode(neg_inf_encoded) == -math.inf

        # Test NaN (special case: NaN != NaN, so we check with isnan)
        nan_encoded = encode(math.nan)
        assert math.isnan(decode(nan_encoded))


class TestStrings:
    """Tests for string type serialization."""

    def test_encode_empty_string(self):
        """Test encoding empty string."""
        result = encode("")
        assert result is not None
        assert isinstance(result, str)

    def test_encode_simple_string(self):
        """Test encoding simple string."""
        result = encode("hello")
        assert result is not None
        assert isinstance(result, str)

    def test_decode_string(self):
        """Test decoding string value."""
        encoded = encode("hello world")
        result = decode(encoded)
        assert result == "hello world"
        assert type(result) == str

    def test_roundtrip_string(self):
        """Test roundtrip encoding/decoding of strings."""
        test_values = [
            "",
            "hello",
            "hello world",
            "Hello, World!",
            "multi\nline\nstring",
            "tab\tseparated",
            "unicode: 你好世界 🌍",
            "special chars: @#$%^&*()",
        ]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value
            assert type(decoded) == str

    def test_string_with_quotes(self):
        """Test encoding/decoding strings with quotes."""
        test_values = [
            "string with 'single quotes'",
            'string with "double quotes"',
            """string with "both" 'quotes'""",
        ]
        for value in test_values:
            encoded = encode(value)
            decoded = decode(encoded)
            assert decoded == value
