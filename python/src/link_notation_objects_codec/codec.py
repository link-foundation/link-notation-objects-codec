"""Object encoder/decoder for Links Notation format."""

import base64
import math
from typing import Any, Dict, List, Optional, Set

from links_notation import Link, Parser, format_links


class ObjectCodec:
    """Codec for encoding/decoding Python objects to/from Links Notation."""

    # Type identifiers
    TYPE_NONE = "None"
    TYPE_BOOL = "bool"
    TYPE_INT = "int"
    TYPE_FLOAT = "float"
    TYPE_STR = "str"
    TYPE_LIST = "list"
    TYPE_DICT = "dict"

    def __init__(self) -> None:
        """Initialize the codec."""
        self.parser = Parser()
        # For tracking object identity during encoding
        self._encode_memo: Dict[int, str] = {}
        self._encode_counter: int = 0
        # For tracking which objects need IDs (referenced multiple times or circularly)
        self._needs_id: Set[int] = set()
        # For tracking references during decoding
        self._decode_memo: Dict[str, Any] = {}
        # For storing all links during multi-link decoding
        self._all_links: List[Any] = []

    def _make_link(self, *parts: str) -> Link:
        """
        Create a Link from string parts.

        Args:
            *parts: String parts to include in the link

        Returns:
            Link object with parts as Link values
        """
        # Each part becomes a Link with that id
        values = [Link(link_id=part) for part in parts]
        return Link(values=values)

    def _find_objects_needing_ids(self, obj: Any, seen: Optional[Dict[int, List[int]]] = None, path: Optional[List[int]] = None) -> None:
        """
        First pass: identify which objects need IDs (referenced multiple times or circularly).

        Args:
            obj: The object to analyze
            seen: Dict mapping object ID to list of parent IDs in the path
            path: Current path of object IDs from root
        """
        if seen is None:
            seen = {}
        if path is None:
            path = []

        # Only track mutable objects
        if not isinstance(obj, (list, dict)):
            return

        obj_id = id(obj)

        # If we've seen this object before, it's referenced multiple times or circularly
        if obj_id in seen:
            self._needs_id.add(obj_id)
            # Also mark all objects in the cycle as needing IDs
            if obj_id in path:
                # This is a circular reference - mark all objects in the cycle
                cycle_start = path.index(obj_id)
                for cycle_obj_id in path[cycle_start:]:
                    self._needs_id.add(cycle_obj_id)
            return  # Don't recurse again

        # Mark as seen with current path
        seen[obj_id] = list(path)
        # Add to current path
        new_path = path + [obj_id]

        # Recurse into structure
        if isinstance(obj, list):
            for item in obj:
                self._find_objects_needing_ids(item, seen, new_path)
        elif isinstance(obj, dict):
            for key, value in obj.items():
                self._find_objects_needing_ids(key, seen, new_path)
                self._find_objects_needing_ids(value, seen, new_path)

    def encode(self, obj: Any) -> str:
        """
        Encode a Python object to Links Notation format.

        Args:
            obj: The Python object to encode

        Returns:
            String representation in Links Notation format
        """
        # Reset state for each encode operation
        self._encode_memo = {}
        self._encode_counter = 0
        self._needs_id = set()

        # First pass: identify which objects need IDs (referenced multiple times or circularly)
        self._find_objects_needing_ids(obj)

        # Encode the object
        link = self._encode_value(obj, depth=0)

        # Return formatted link
        return link.format()

    def decode(self, notation: str) -> Any:
        """
        Decode Links Notation format to a Python object.

        Args:
            notation: String in Links Notation format

        Returns:
            Reconstructed Python object
        """
        # Reset state for each decode operation
        self._decode_memo = {}
        self._all_links = []

        links = self.parser.parse(notation)
        if not links:
            return None

        # If there are multiple links, store them all for forward reference resolution
        if len(links) > 1:
            self._all_links = links
            # Decode the first link (this will be the main result)
            # Forward references will be resolved automatically
            result = self._decode_link(links[0])
            return result

        link = links[0]

        # Handle case where format() creates output like (obj_0) which parser wraps
        # The parser returns a wrapper Link with no ID, containing the actual Link as first value
        if (not link.id and link.values and len(link.values) == 1 and
            hasattr(link.values[0], 'id') and link.values[0].id and
            link.values[0].id.startswith('obj_')):
            # Extract the actual Link
            link = link.values[0]

        return self._decode_link(link)

    def _encode_value(self, obj: Any, visited: Optional[Set[int]] = None, depth: int = 0) -> Link:
        """
        Encode a value into a Link.

        Args:
            obj: The value to encode
            visited: Set of object IDs currently being processed (for cycle detection)
            depth: Current nesting depth (0 = top level)

        Returns:
            Link object
        """
        if visited is None:
            visited = set()

        obj_id = id(obj)

        # Check if we've seen this object before (for circular references and shared objects)
        # Only track mutable objects (lists, dicts)
        if isinstance(obj, (list, dict)) and obj_id in self._encode_memo:
            # If depth > 0, return a reference
            # If depth == 0, we're encoding this as a top-level definition, so continue
            if depth > 0:
                ref_id = self._encode_memo[obj_id]
                return Link(link_id=ref_id)

        # For mutable objects that need IDs, assign them
        if isinstance(obj, (list, dict)) and obj_id in self._needs_id:
            # Assign an ID if not already assigned
            if obj_id not in self._encode_memo:
                ref_id = f"obj_{self._encode_counter}"
                self._encode_counter += 1
                self._encode_memo[obj_id] = ref_id
            else:
                ref_id = self._encode_memo[obj_id]

            if obj_id in visited:
                # We're in a cycle, create a direct reference
                return Link(link_id=ref_id)

            # Add to visited set
            visited = visited | {obj_id}

        # Encode based on type
        if obj is None:
            return self._make_link(self.TYPE_NONE)

        elif isinstance(obj, bool):
            # Must check bool before int because bool is a subclass of int
            return self._make_link(self.TYPE_BOOL, str(obj))

        elif isinstance(obj, int):
            return self._make_link(self.TYPE_INT, str(obj))

        elif isinstance(obj, float):
            # Handle special float values
            if math.isnan(obj):
                return self._make_link(self.TYPE_FLOAT, "NaN")
            elif math.isinf(obj):
                if obj > 0:
                    return self._make_link(self.TYPE_FLOAT, "Infinity")
                else:
                    return self._make_link(self.TYPE_FLOAT, "-Infinity")
            else:
                return self._make_link(self.TYPE_FLOAT, str(obj))

        elif isinstance(obj, str):
            # Encode strings as base64 to handle special characters, newlines, etc.
            b64_encoded = base64.b64encode(obj.encode('utf-8')).decode('ascii')
            return self._make_link(self.TYPE_STR, b64_encoded)

        elif isinstance(obj, list):
            parts = []
            for item in obj:
                # Encode each item with increased depth
                item_link = self._encode_value(item, visited, depth + 1)
                parts.append(item_link)
            # If this list has an ID, use self-reference format: (obj_id: list item1 item2 ...)
            if obj_id in self._encode_memo:
                ref_id = self._encode_memo[obj_id]
                return Link(link_id=ref_id, values=[Link(link_id=self.TYPE_LIST)] + parts)
            else:
                # Wrap in a type marker for lists without IDs: (list item1 item2 ...)
                return Link(values=[Link(link_id=self.TYPE_LIST)] + parts)

        elif isinstance(obj, dict):
            parts = []
            for key, value in obj.items():
                # Encode key and value with increased depth
                key_link = self._encode_value(key, visited, depth + 1)
                value_link = self._encode_value(value, visited, depth + 1)
                # Create a pair link
                pair = Link(values=[key_link, value_link])
                parts.append(pair)
            # If this dict has an ID, use self-reference format: (obj_id: dict (key val) ...)
            if obj_id in self._encode_memo:
                ref_id = self._encode_memo[obj_id]
                return Link(link_id=ref_id, values=[Link(link_id=self.TYPE_DICT)] + parts)
            else:
                # Wrap in a type marker for dicts without IDs: (dict (key val) ...)
                return Link(values=[Link(link_id=self.TYPE_DICT)] + parts)

        else:
            raise TypeError(f"Unsupported type: {type(obj)}")

    def _decode_link(self, link: Link) -> Any:
        """
        Decode a Link into a Python value.

        Args:
            link: Link object to decode

        Returns:
            Decoded Python value
        """
        # Check if this is a direct reference to a previously decoded object
        # Direct references have an id but no values, or the id refers to an existing object
        if link.id and link.id in self._decode_memo:
            return self._decode_memo[link.id]

        if not link.values:
            # Empty link - this might be a simple id, reference, or empty collection
            if link.id:
                # If it's in memo, return the cached object
                if link.id in self._decode_memo:
                    return self._decode_memo[link.id]

                # If it starts with obj_, check if we have a forward reference in _all_links
                if link.id.startswith('obj_') and self._all_links:
                    # Look for this ID in the remaining links
                    for other_link in self._all_links:
                        if hasattr(other_link, 'id') and other_link.id == link.id:
                            # Found it! Decode it now
                            return self._decode_link(other_link)

                    # Not found in links - create empty list as fallback
                    result = []
                    self._decode_memo[link.id] = result
                    return result

                # Otherwise it's just a string ID
                return link.id
            return None

        # Check if this link has a self-reference ID (format: obj_0: type ...)
        self_ref_id = None
        if link.id and link.id.startswith('obj_'):
            self_ref_id = link.id

        # Get the type marker from the first value
        first_value = link.values[0]
        if not hasattr(first_value, 'id') or not first_value.id:
            # Not a type marker we recognize
            return None

        type_marker = first_value.id

        if type_marker == self.TYPE_NONE:
            return None

        elif type_marker == self.TYPE_BOOL:
            if len(link.values) > 1:
                bool_value = link.values[1]
                if hasattr(bool_value, 'id'):
                    return bool_value.id == "True"
            return False

        elif type_marker == self.TYPE_INT:
            if len(link.values) > 1:
                int_value = link.values[1]
                if hasattr(int_value, 'id'):
                    return int(int_value.id)
            return 0

        elif type_marker == self.TYPE_FLOAT:
            if len(link.values) > 1:
                float_value = link.values[1]
                if hasattr(float_value, 'id'):
                    value_str = float_value.id
                    if value_str == "NaN":
                        return math.nan
                    elif value_str == "Infinity":
                        return math.inf
                    elif value_str == "-Infinity":
                        return -math.inf
                    else:
                        return float(value_str)
            return 0.0

        elif type_marker == self.TYPE_STR:
            if len(link.values) > 1:
                str_value = link.values[1]
                if hasattr(str_value, 'id'):
                    b64_str = str_value.id
                    # Decode from base64
                    try:
                        decoded_bytes = base64.b64decode(b64_str)
                        return decoded_bytes.decode('utf-8')
                    except Exception:
                        # If decode fails, return the raw value
                        return b64_str
            return ""

        elif type_marker == self.TYPE_LIST:
            # New format with self-reference: (obj_0: list item1 item2 ...)
            # Old format (for backward compatibility): (list obj_id item1 item2 ...)
            start_idx = 1
            list_id = self_ref_id  # Use self-reference ID from link.id if present

            # Check for old format with obj_id as second element
            if not list_id and len(link.values) > 1:
                second = link.values[1]
                if hasattr(second, 'id') and second.id and second.id.startswith('obj_'):
                    list_id = second.id
                    start_idx = 2

            result_list: List[Any] = []
            if list_id:
                self._decode_memo[list_id] = result_list

            for item_link in link.values[start_idx:]:
                decoded_item = self._decode_link(item_link)
                result_list.append(decoded_item)
            return result_list

        elif type_marker == self.TYPE_DICT:
            # New format with self-reference: (obj_0: dict (key val) ...)
            # Old format (for backward compatibility): (dict obj_id (key val) ...)
            start_idx = 1
            dict_id = self_ref_id  # Use self-reference ID from link.id if present

            # Check for old format with obj_id as second element
            if not dict_id and len(link.values) > 1:
                second = link.values[1]
                if hasattr(second, 'id') and second.id and second.id.startswith('obj_'):
                    dict_id = second.id
                    start_idx = 2

            result_dict: Dict[Any, Any] = {}
            if dict_id:
                self._decode_memo[dict_id] = result_dict

            for pair_link in link.values[start_idx:]:
                if hasattr(pair_link, 'values') and len(pair_link.values) >= 2:
                    key_link = pair_link.values[0]
                    value_link = pair_link.values[1]

                    decoded_key = self._decode_link(key_link)
                    decoded_value = self._decode_link(value_link)

                    result_dict[decoded_key] = decoded_value
            return result_dict

        else:
            # Unknown type marker
            raise ValueError(f"Unknown type marker: {type_marker}")


# Convenience functions
_default_codec = ObjectCodec()


def encode(obj: Any) -> str:
    """
    Encode a Python object to Links Notation format.

    Args:
        obj: The Python object to encode

    Returns:
        String representation in Links Notation format
    """
    return _default_codec.encode(obj)


def decode(notation: str) -> Any:
    """
    Decode Links Notation format to a Python object.

    Args:
        notation: String in Links Notation format

    Returns:
        Reconstructed Python object
    """
    return _default_codec.decode(notation)
