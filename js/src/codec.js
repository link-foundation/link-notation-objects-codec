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
    // For tracking which objects need IDs (referenced multiple times or circularly)
    this._needsId = new Set();
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
   * First pass: identify which objects need IDs (referenced multiple times or circularly).
   * @param {*} obj - The object to analyze
   * @param {Map} seen - Map tracking how many times we've seen each object
   */
  _findObjectsNeedingIds(obj, seen = new Map()) {
    // Only track mutable objects (arrays and objects)
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    // If we've seen this object before, it needs an ID
    if (seen.has(obj)) {
      this._needsId.add(obj);
      return; // Don't recurse again
    }

    // Mark as seen
    seen.set(obj, 1);

    // Recurse into structure
    if (Array.isArray(obj)) {
      for (const item of obj) {
        this._findObjectsNeedingIds(item, seen);
      }
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        this._findObjectsNeedingIds(key, seen);
        this._findObjectsNeedingIds(value, seen);
      }
    }
  }

  /**
   * Second pass: mark containers that contain objects with IDs as also needing IDs.
   * This avoids parser bugs with formats like (array (obj_0: ...) ...).
   * @param {*} obj - The object to analyze
   * @param {Set} visited - Set of objects already visited
   * @returns {boolean} True if this object or any of its children needs an ID
   */
  _markContainersWithIdChildren(obj, visited) {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    // Avoid infinite recursion
    if (visited.has(obj)) {
      return this._needsId.has(obj);
    }

    visited.add(obj);

    // Check if this object already needs an ID
    let hasIdChild = this._needsId.has(obj);

    // Check children
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (this._markContainersWithIdChildren(item, visited)) {
          hasIdChild = true;
        }
      }
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (this._markContainersWithIdChildren(key, visited)) {
          hasIdChild = true;
        }
        if (this._markContainersWithIdChildren(value, visited)) {
          hasIdChild = true;
        }
      }
    }

    // If any child needs an ID, this container also needs an ID
    if (hasIdChild) {
      this._needsId.add(obj);
    }

    return hasIdChild;
  }

  /**
   * Encode a JavaScript object to Links Notation format.
   * @param {*} obj - The JavaScript object to encode
   * @returns {string} String representation in Links Notation format
   */
  encode(obj) {
    // Reset state for each encode operation
    this._encodeMemo = new Map();
    this._encodeCounter = 0;
    this._needsId = new Set();

    // First pass: identify which objects need IDs (referenced multiple times or circularly)
    this._findObjectsNeedingIds(obj);

    // Second pass: mark containers that contain objects with IDs as also needing IDs
    // This avoids parser bugs with formats like (array (obj_0: ...) ...)
    this._markContainersWithIdChildren(obj, new Set());

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

      // For mutable objects that need IDs, assign them
      if (this._needsId.has(obj)) {
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
      const parts = [];
      for (const item of obj) {
        // Encode each item
        const itemLink = this._encodeValue(item, visited);
        parts.push(itemLink);
      }
      // If this array has an ID, use format: (array obj_id item1 item2 ...)
      // This avoids parser bugs with the `: ` syntax
      if (this._encodeMemo.has(obj)) {
        const refId = this._encodeMemo.get(obj);
        return new Link(undefined, [new Link(ObjectCodec.TYPE_ARRAY), new Link(refId), ...parts]);
      } else {
        // Wrap in a type marker for arrays without IDs: (array item1 item2 ...)
        return new Link(undefined, [new Link(ObjectCodec.TYPE_ARRAY), ...parts]);
      }
    }

    if (typeof obj === 'object') {
      const parts = [];
      for (const [key, value] of Object.entries(obj)) {
        // Encode key and value
        const keyLink = this._encodeValue(key, visited);
        const valueLink = this._encodeValue(value, visited);
        // Create a pair link
        const pair = new Link(undefined, [keyLink, valueLink]);
        parts.push(pair);
      }
      // If this object has an ID, use format: (object obj_id (key val) ...)
      // This avoids parser bugs with the `: ` syntax
      if (this._encodeMemo.has(obj)) {
        const refId = this._encodeMemo.get(obj);
        return new Link(undefined, [new Link(ObjectCodec.TYPE_OBJECT), new Link(refId), ...parts]);
      } else {
        // Wrap in a type marker for objects without IDs: (object (key val) ...)
        return new Link(undefined, [new Link(ObjectCodec.TYPE_OBJECT), ...parts]);
      }
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

    if (typeMarker === ObjectCodec.TYPE_ARRAY) {
      // Check if second element is an obj_id: (array obj_id item1 item2 ...)
      let startIdx = 1;
      let arrayId = null;
      if (link.values.length > 1) {
        const second = link.values[1];
        if (second && second.id && second.id.startsWith('obj_')) {
          arrayId = second.id;
          startIdx = 2;
        }
      }

      const resultArray = [];
      if (arrayId) {
        this._decodeMemo.set(arrayId, resultArray);
      }

      for (let i = startIdx; i < link.values.length; i++) {
        const itemLink = link.values[i];
        const decodedItem = this._decodeLink(itemLink);
        resultArray.push(decodedItem);
      }
      return resultArray;
    }

    if (typeMarker === ObjectCodec.TYPE_OBJECT) {
      // Check if second element is an obj_id: (object obj_id (key val) ...)
      let startIdx = 1;
      let objectId = null;
      if (link.values.length > 1) {
        const second = link.values[1];
        if (second && second.id && second.id.startsWith('obj_')) {
          objectId = second.id;
          startIdx = 2;
        }
      }

      const resultObject = {};
      if (objectId) {
        this._decodeMemo.set(objectId, resultObject);
      }

      for (let i = startIdx; i < link.values.length; i++) {
        const pairLink = link.values[i];
        if (pairLink.values && pairLink.values.length >= 2) {
          const keyLink = pairLink.values[0];
          const valueLink = pairLink.values[1];

          const decodedKey = this._decodeLink(keyLink);
          const decodedValue = this._decodeLink(valueLink);

          resultObject[decodedKey] = decodedValue;
        }
      }
      return resultObject;
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
