/**
 * Tests for encoding/decoding collections (arrays and objects).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode } from '../src/index.js';

// Tests for array serialization
test('encode empty array', () => {
  const result = encode([]);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode empty array', () => {
  const encoded = encode([]);
  const result = decode(encoded);
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('roundtrip empty array', () => {
  const original = [];
  const encoded = encode(original);
  const decoded = decode(encoded);
  assert.deepEqual(decoded, original);
});

test('encode array with basic types', () => {
  const array = [1, 'hello', true, null, 3.14];
  const result = encode(array);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode array with basic types', () => {
  const array = [1, 'hello', true, null, 3.14];
  const encoded = encode(array);
  const result = decode(encoded);
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 5);
  assert.equal(result[0], 1);
  assert.equal(result[1], 'hello');
  assert.equal(result[2], true);
  assert.equal(result[3], null);
  assert.equal(Math.abs(result[4] - 3.14) < 0.0001, true);
});

test('roundtrip array with mixed types', () => {
  const testArrays = [
    [1, 2, 3],
    ['a', 'b', 'c'],
    [true, false, true],
    [1, 'hello', true, null],
    [null, undefined, false, 0, ''],
  ];
  for (const array of testArrays) {
    const encoded = encode(array);
    const decoded = decode(encoded);
    assert.deepEqual(decoded, array);
  }
});

test('nested arrays', () => {
  const testArrays = [
    [[1, 2], [3, 4]],
    [[1, 2], [3, 4], [5, [6, 7]]],
    [[[1]], [[2]], [[3]]],
  ];
  for (const array of testArrays) {
    const encoded = encode(array);
    const decoded = decode(encoded);
    assert.deepEqual(decoded, array);
  }
});

// Tests for object serialization
test('encode empty object', () => {
  const result = encode({});
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode empty object', () => {
  const encoded = encode({});
  const result = decode(encoded);
  assert.equal(typeof result, 'object');
  assert.equal(Object.keys(result).length, 0);
});

test('roundtrip empty object', () => {
  const original = {};
  const encoded = encode(original);
  const decoded = decode(encoded);
  assert.deepEqual(decoded, original);
});

test('encode object with basic types', () => {
  const obj = {
    name: 'Alice',
    age: 30,
    active: true,
    score: 95.5,
    empty: null,
  };
  const result = encode(obj);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode object with basic types', () => {
  const obj = {
    name: 'Alice',
    age: 30,
    active: true,
  };
  const encoded = encode(obj);
  const result = decode(encoded);
  assert.equal(typeof result, 'object');
  assert.equal(result.name, 'Alice');
  assert.equal(result.age, 30);
  assert.equal(result.active, true);
});

test('roundtrip object with mixed types', () => {
  const testObjects = [
    { a: 1 },
    { a: 1, b: 2, c: 3 },
    { name: 'Bob', age: 25 },
    { flag: true, count: 0, text: '' },
    { x: null, y: undefined, z: false },
  ];
  for (const obj of testObjects) {
    const encoded = encode(obj);
    const decoded = decode(encoded);
    assert.deepEqual(decoded, obj);
  }
});

test('nested objects', () => {
  const testObjects = [
    { user: { name: 'Alice', age: 30 } },
    {
      outer: {
        inner: {
          deep: 'value',
        },
      },
    },
    {
      a: { b: 1 },
      c: { d: 2 },
    },
  ];
  for (const obj of testObjects) {
    const encoded = encode(obj);
    const decoded = decode(encoded);
    assert.deepEqual(decoded, obj);
  }
});

test('mixed nested structures', () => {
  const complex = {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
    metadata: {
      version: 1,
      count: 2,
    },
    tags: ['important', 'reviewed'],
  };

  const encoded = encode(complex);
  const decoded = decode(encoded);
  assert.deepEqual(decoded, complex);
});

test('array of objects', () => {
  const data = [
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false },
    { id: 3, name: 'Charlie', active: true },
  ];

  const encoded = encode(data);
  const decoded = decode(encoded);
  assert.deepEqual(decoded, data);
});

test('object with array values', () => {
  const data = {
    numbers: [1, 2, 3, 4, 5],
    strings: ['a', 'b', 'c'],
    mixed: [1, 'two', true, null],
  };

  const encoded = encode(data);
  const decoded = decode(encoded);
  assert.deepEqual(decoded, data);
});

test('deeply nested structure', () => {
  const deep = {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: {
              value: 'deep',
              array: [1, 2, [3, 4, [5]]],
            },
          },
        },
      },
    },
  };

  const encoded = encode(deep);
  const decoded = decode(encoded);
  assert.deepEqual(decoded, deep);
});
