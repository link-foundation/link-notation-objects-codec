/**
 * Object encoder/decoder for Links Notation format.
 */

import { Parser, Link } from 'links-notation';

/**
 * Codec for encoding/decoding JavaScript objects to/from Links Notation.
 */
export class ObjectCodec {
  // Type identifiers
  static TYPE_NULL = 'null';
  static TYPE_UNDEFINED = 'undefined';
  static TYPE_BOOL = 'bool';
  static TYPE_INT = 'int';
  static TYPE_FLOAT = 'float';
  static TYPE_STR = 'str';
  static TYPE_ARRAY = 'array';
  static TYPE_OBJECT = 'object';

  constructor() {
    this.parser = new Parser();
    // For tracking object identity during encoding
    this._encodeMemo = new Map();
    this._encodeCounter = 0;
    // For tracking references during decoding
    this._decodeMemo = new Map();
  }

  /**
   * Create a Link from string parts.
   * @param {...string} parts - String parts to include in the link
   * @returns {Link} Link object with parts as Link values
   */
  _makeLink(...parts) {
    // Each part becomes a Link with that id
    const values = parts.map(part => new Link(part));
    return new Link(undefined, values);
  }

  /**
   * Encode a JavaScript object to Links Notation format.
   * @param {*} obj - The JavaScript object to encode
   * @returns {string} String representation in Links Notation format
   */
  encode(obj) {
    // Reset memo for each encode operation
    this._encodeMemo = new Map();
    this._encodeCounter = 0;

    // Encode
    const link = this._encodeValue(obj);
    // Use link.format() directly instead of wrapping
    return link.format();
  }

  /**
   * Decode Links Notation format to a JavaScript object.
   * @param {string} notation - String in Links Notation format
   * @returns {*} Reconstructed JavaScript object
   */
  decode(notation) {
    // Reset memo for each decode operation
    this._decodeMemo = new Map();

    const links = this.parser.parse(notation);
    if (!links || links.length === 0) {
      return null;
    }

    let link = links[0];

    // Handle case where format() creates output like (obj_0) which parser wraps
    // The parser returns a wrapper Link with no ID, containing the actual Link as first value
    if (!link.id && link.values && link.values.length === 1 &&
        link.values[0].id && link.values[0].id.startsWith('obj_')) {
      // Extract the actual Link
      link = link.values[0];
    }

    return this._decodeLink(link);
  }

  /**
   * Encode a value into a Link.
   * @param {*} obj - The value to encode
   * @param {Set} visited - Set of object references currently being processed (for cycle detection)
   * @returns {Link} Link object
   */
  _encodeValue(obj, visited = new Set()) {
    // Check if we've seen this object before (for circular references and shared objects)
    // Only track objects and arrays (mutable types)
    if (obj !== null && (typeof obj === 'object')) {
      if (this._encodeMemo.has(obj)) {
        // Return a direct reference using the object's ID
        const refId = this._encodeMemo.get(obj);
        return new Link(refId);
      }

      // For mutable objects, check if we're in a cycle
      if (visited.has(obj)) {
        // We're in a cycle, create a direct reference
        if (!this._encodeMemo.has(obj)) {
          // Assign an ID for this object
          const refId = `obj_${this._encodeCounter}`;
          this._encodeCounter += 1;
          this._encodeMemo.set(obj, refId);
        }
        const refId = this._encodeMemo.get(obj);
        return new Link(refId);
      }

      // Add to visited set
      visited = new Set([...visited, obj]);

      // Assign an ID to this object
      const refId = `obj_${this._encodeCounter}`;
      this._encodeCounter += 1;
      this._encodeMemo.set(obj, refId);
    }

    // Encode based on type
    if (obj === null) {
      return this._makeLink(ObjectCodec.TYPE_NULL);
    }

    if (obj === undefined) {
      return this._makeLink(ObjectCodec.TYPE_UNDEFINED);
    }

    if (typeof obj === 'boolean') {
      return this._makeLink(ObjectCodec.TYPE_BOOL, String(obj));
    }

    if (typeof obj === 'number') {
      // Handle special float values
      if (Number.isNaN(obj)) {
        return this._makeLink(ObjectCodec.TYPE_FLOAT, 'NaN');
      }
      if (!Number.isFinite(obj)) {
        if (obj > 0) {
          return this._makeLink(ObjectCodec.TYPE_FLOAT, 'Infinity');
        } else {
          return this._makeLink(ObjectCodec.TYPE_FLOAT, '-Infinity');
        }
      }
      // Check if it's an integer
      if (Number.isInteger(obj)) {
        return this._makeLink(ObjectCodec.TYPE_INT, String(obj));
      }
      return this._makeLink(ObjectCodec.TYPE_FLOAT, String(obj));
    }

    if (typeof obj === 'string') {
      // Encode strings as base64 to handle special characters, newlines, etc.
      const b64Encoded = Buffer.from(obj, 'utf-8').toString('base64');
      return this._makeLink(ObjectCodec.TYPE_STR, b64Encoded);
    }

    if (Array.isArray(obj)) {
      // All arrays get IDs now, so we always use link_id
      const refId = this._encodeMemo.get(obj);
      const parts = [];
      for (const item of obj) {
        // Encode each item
        const itemLink = this._encodeValue(item, visited);
        parts.push(itemLink);
      }
      return new Link(refId, parts);
    }

    if (typeof obj === 'object') {
      // All objects get IDs now, so we always use link_id
      const refId = this._encodeMemo.get(obj);
      const parts = [];
      for (const [key, value] of Object.entries(obj)) {
        // Encode key and value
        const keyLink = this._encodeValue(key, visited);
        const valueLink = this._encodeValue(value, visited);
        // Create a pair link
        const pair = new Link(undefined, [keyLink, valueLink]);
        parts.push(pair);
      }
      return new Link(refId, parts);
    }

    throw new TypeError(`Unsupported type: ${typeof obj}`);
  }

  /**
   * Decode a Link into a JavaScript value.
   * @param {Link} link - Link object to decode
   * @returns {*} Decoded JavaScript value
   */
  _decodeLink(link) {
    // Check if this is a direct reference to a previously decoded object
    // Direct references have an id but no values, or the id refers to an existing object
    if (link.id && this._decodeMemo.has(link.id)) {
      return this._decodeMemo.get(link.id);
    }

    if (!link.values || link.values.length === 0) {
      // Empty link - this might be a simple id, reference, or empty collection
      if (link.id) {
        // If it's in memo, return the cached object
        if (this._decodeMemo.has(link.id)) {
          return this._decodeMemo.get(link.id);
        }

        // If it starts with obj_, it's an empty collection
        if (link.id.startsWith('obj_')) {
          // Create empty array (we'll assume array for now; object would have pairs)
          const result = [];
          this._decodeMemo.set(link.id, result);
          return result;
        }

        // Otherwise it's just a string ID
        return link.id;
      }
      return null;
    }

    // Check if this link represents a collection (has link.id and values)
    // In the new format: (obj_0: value1 value2 ...) or (obj_0: (key val) ...)
    if (link.id) {
      // This is a collection with a self-reference ID
      // Determine if it's an array or object by checking the structure of values
      // Objects have ALL values as pairs (links with exactly 2 elements, no type markers)
      // Arrays may have any values including (type value) pairs

      let isObject = false;
      if (link.values) {
        // Check if ALL values are non-typed pairs (object key-value pairs)
        // An object pair looks like: ((str key) value) - two links, first is NOT a simple type marker
        // An array item might look like: (int 1) - two links where first IS a type marker
        // Or an array of arrays: (obj_1: ...) - which is a reference with an id
        let allPairs = true;
        for (const val of link.values) {
          // Check if this is a reference to another object (like obj_1)
          // These are array/object items, not dict pairs
          if (val.id && val.id.startsWith('obj_')) {
            allPairs = false;
            break;
          }

          if (!val.values || val.values.length !== 2) {
            allPairs = false;
            break;
          }
          // Check if this is a type marker pattern (type value) vs key-value pair
          // Type markers: int, str, float, bool, null, undefined, array, object
          // If the first element of the pair is a type marker with no nested values, it's NOT an object pair
          const firstElem = val.values[0];
          if (firstElem.values && firstElem.values.length === 0 && firstElem.id &&
              [ObjectCodec.TYPE_INT, ObjectCodec.TYPE_STR, ObjectCodec.TYPE_FLOAT,
               ObjectCodec.TYPE_BOOL, ObjectCodec.TYPE_NULL, ObjectCodec.TYPE_UNDEFINED,
               ObjectCodec.TYPE_ARRAY, ObjectCodec.TYPE_OBJECT].includes(firstElem.id)) {
            // This is a typed value, not an object pair
            allPairs = false;
            break;
          }
        }

        isObject = allPairs;
      }

      if (isObject) {
        // Decode as object
        const resultObject = {};
        this._decodeMemo.set(link.id, resultObject);

        for (const pairLink of link.values) {
          if (pairLink.values && pairLink.values.length >= 2) {
            const keyLink = pairLink.values[0];
            const valueLink = pairLink.values[1];

            const decodedKey = this._decodeLink(keyLink);
            const decodedValue = this._decodeLink(valueLink);

            resultObject[decodedKey] = decodedValue;
          }
        }

        return resultObject;
      } else {
        // Decode as array
        const resultArray = [];
        this._decodeMemo.set(link.id, resultArray);

        for (const itemLink of link.values) {
          const decodedItem = this._decodeLink(itemLink);
          resultArray.push(decodedItem);
        }

        return resultArray;
      }
    }

    // Get the type marker from the first value
    const firstValue = link.values[0];
    if (!firstValue || !firstValue.id) {
      // Not a type marker we recognize
      return null;
    }

    const typeMarker = firstValue.id;

    if (typeMarker === ObjectCodec.TYPE_NULL) {
      return null;
    }

    if (typeMarker === ObjectCodec.TYPE_UNDEFINED) {
      return undefined;
    }

    if (typeMarker === ObjectCodec.TYPE_BOOL) {
      if (link.values.length > 1) {
        const boolValue = link.values[1];
        if (boolValue && boolValue.id) {
          return boolValue.id === 'true';
        }
      }
      return false;
    }

    if (typeMarker === ObjectCodec.TYPE_INT) {
      if (link.values.length > 1) {
        const intValue = link.values[1];
        if (intValue && intValue.id) {
          return parseInt(intValue.id, 10);
        }
      }
      return 0;
    }

    if (typeMarker === ObjectCodec.TYPE_FLOAT) {
      if (link.values.length > 1) {
        const floatValue = link.values[1];
        if (floatValue && floatValue.id) {
          const valueStr = floatValue.id;
          if (valueStr === 'NaN') {
            return NaN;
          } else if (valueStr === 'Infinity') {
            return Infinity;
          } else if (valueStr === '-Infinity') {
            return -Infinity;
          } else {
            return parseFloat(valueStr);
          }
        }
      }
      return 0.0;
    }

    if (typeMarker === ObjectCodec.TYPE_STR) {
      if (link.values.length > 1) {
        const strValue = link.values[1];
        if (strValue && strValue.id) {
          const b64Str = strValue.id;
          // Decode from base64
          try {
            return Buffer.from(b64Str, 'base64').toString('utf-8');
          } catch (e) {
            // If decode fails, return the raw value
            return b64Str;
          }
        }
      }
      return '';
    }

    // Unknown type marker
    throw new Error(`Unknown type marker: ${typeMarker}`);
  }
}

// Convenience functions
const _defaultCodec = new ObjectCodec();

/**
 * Encode a JavaScript object to Links Notation format.
 * @param {*} obj - The JavaScript object to encode
 * @returns {string} String representation in Links Notation format
 */
export function encode(obj) {
  return _defaultCodec.encode(obj);
}

/**
 * Decode Links Notation format to a JavaScript object.
 * @param {string} notation - String in Links Notation format
 * @returns {*} Reconstructed JavaScript object
 */
export function decode(notation) {
  return _defaultCodec.decode(notation);
}
