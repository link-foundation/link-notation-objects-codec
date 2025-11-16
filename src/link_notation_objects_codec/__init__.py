"""
Link Notation Objects Codec - Universal serializer/deserializer for Python objects.

This library provides serialization and deserialization of Python objects to/from
Links Notation format, with support for circular references and complex object graphs.
"""

from .codec import ObjectCodec, encode, decode

__version__ = "0.1.0"
__all__ = ["ObjectCodec", "encode", "decode"]
