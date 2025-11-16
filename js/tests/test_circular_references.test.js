/**
 * Tests for encoding/decoding circular references and shared object references.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode } from '../src/index.js';

// Tests for circular references in arrays
test('self-referencing array', () => {
  const arr = [1, 2, 3];
  arr.push(arr); // Circular reference

  const encoded = encode(arr);
  // Verify correct Links Notation format with self-reference
  assert.equal(encoded, '(obj_0: array (int 1) (int 2) (int 3) obj_0)');

  const decoded = decode(encoded);
  assert.ok(Array.isArray(decoded));
  assert.equal(decoded.length, 4);
  assert.equal(decoded[0], 1);
  assert.equal(decoded[1], 2);
  assert.equal(decoded[2], 3);
  assert.equal(decoded[3], decoded); // Circular reference preserved
});

test('array with self in middle', () => {
  const arr = [1, 2];
  arr.push(arr);
  arr.push(3);

  const encoded = encode(arr);
  const decoded = decode(encoded);

  assert.equal(decoded.length, 4);
  assert.equal(decoded[0], 1);
  assert.equal(decoded[1], 2);
  assert.equal(decoded[2], decoded); // Self reference
  assert.equal(decoded[3], 3);
});

test('nested array with circular reference', () => {
  const inner = [1, 2];
  const outer = [inner, 3];
  inner.push(outer); // Create circular reference: inner -> outer -> inner

  const encoded = encode(outer);
  const decoded = decode(encoded);

  assert.equal(decoded.length, 2);
  assert.equal(decoded[1], 3);
  assert.ok(Array.isArray(decoded[0]));
  assert.equal(decoded[0][0], 1);
  assert.equal(decoded[0][1], 2);
  assert.equal(decoded[0][2], decoded); // Circular reference preserved
});

// Tests for circular references in objects
test('self-referencing object', () => {
  const obj = { name: 'root' };
  obj.self = obj; // Circular reference

  const encoded = encode(obj);
  // Verify correct Links Notation format with self-reference
  // Note: JavaScript object key order may vary, so we check for both possible orders
  const isValidFormat =
    encoded === '(obj_0: object ((str bmFtZQ==) (str cm9vdA==)) ((str c2VsZg==) obj_0))' ||
    encoded === '(obj_0: object ((str c2VsZg==) obj_0) ((str bmFtZQ==) (str cm9vdA==)))';
  assert.ok(isValidFormat, `Expected valid self-reference format, got: ${encoded}`);

  const decoded = decode(encoded);
  assert.equal(typeof decoded, 'object');
  assert.equal(decoded.name, 'root');
  assert.equal(decoded.self, decoded); // Circular reference preserved
});

test('object with multiple self-references', () => {
  const obj = { name: 'root' };
  obj.ref1 = obj;
  obj.ref2 = obj;
  obj.ref3 = obj;

  const encoded = encode(obj);
  const decoded = decode(encoded);

  assert.equal(decoded.name, 'root');
  assert.equal(decoded.ref1, decoded);
  assert.equal(decoded.ref2, decoded);
  assert.equal(decoded.ref3, decoded);
  assert.equal(decoded.ref1, decoded.ref2);
});

test('nested object with circular reference', () => {
  const child = { name: 'child' };
  const parent = { name: 'parent', child: child };
  child.parent = parent; // Create circular reference

  const encoded = encode(parent);
  const decoded = decode(encoded);

  assert.equal(decoded.name, 'parent');
  assert.equal(decoded.child.name, 'child');
  assert.equal(decoded.child.parent, decoded); // Circular reference preserved
});

test('complex circular structure (tree with back-references)', () => {
  const root = { name: 'root', children: [] };
  const child1 = { name: 'child1', parent: root };
  const child2 = { name: 'child2', parent: root };
  root.children.push(child1, child2);

  const encoded = encode(root);
  const decoded = decode(encoded);

  assert.equal(decoded.name, 'root');
  assert.equal(decoded.children.length, 2);
  assert.equal(decoded.children[0].name, 'child1');
  assert.equal(decoded.children[1].name, 'child2');
  assert.equal(decoded.children[0].parent, decoded);
  assert.equal(decoded.children[1].parent, decoded);
  assert.equal(decoded.children[0].parent, decoded.children[1].parent);
});

// Tests for shared object references
test('shared object reference', () => {
  const shared = { value: 42 };
  const container = {
    first: shared,
    second: shared,
  };

  const encoded = encode(container);
  const decoded = decode(encoded);

  assert.equal(decoded.first.value, 42);
  assert.equal(decoded.second.value, 42);
  assert.equal(decoded.first, decoded.second); // Same object reference
});

test('shared object reference - modification', () => {
  const shared = { value: 42 };
  const container = {
    first: shared,
    second: shared,
  };

  const encoded = encode(container);
  const decoded = decode(encoded);

  // Modify through one reference
  decoded.first.modified = true;

  // Should be visible through other reference
  assert.equal(decoded.second.modified, true);
  assert.equal(decoded.first, decoded.second);
});

test('multiple shared objects', () => {
  const obj1 = { id: 1 };
  const obj2 = { id: 2 };
  const container = {
    a: obj1,
    b: obj2,
    c: obj1, // Share obj1
    d: obj2, // Share obj2
  };

  const encoded = encode(container);
  const decoded = decode(encoded);

  assert.equal(decoded.a.id, 1);
  assert.equal(decoded.b.id, 2);
  assert.equal(decoded.a, decoded.c); // Same reference
  assert.equal(decoded.b, decoded.d); // Same reference
  assert.notEqual(decoded.a, decoded.b); // Different objects
});

test('shared array reference', () => {
  const shared = [1, 2, 3];
  const container = {
    first: shared,
    second: shared,
    third: shared,
  };

  const encoded = encode(container);
  const decoded = decode(encoded);

  assert.deepEqual(decoded.first, [1, 2, 3]);
  assert.equal(decoded.first, decoded.second);
  assert.equal(decoded.second, decoded.third);

  // Modify through one reference
  decoded.first.push(4);

  // Should be visible through other references
  assert.equal(decoded.second.length, 4);
  assert.equal(decoded.third[3], 4);
});

test('circular and shared references combined', () => {
  const shared = { shared: 'data' };
  const obj = {
    name: 'root',
    ref1: shared,
    ref2: shared,
  };
  obj.self = obj; // Add circular reference

  const encoded = encode(obj);
  const decoded = decode(encoded);

  assert.equal(decoded.name, 'root');
  assert.equal(decoded.ref1.shared, 'data');
  assert.equal(decoded.ref1, decoded.ref2); // Shared reference
  assert.equal(decoded.self, decoded); // Circular reference
});

test('deeply nested circular structure', () => {
  const a = { name: 'a' };
  const b = { name: 'b', ref: a };
  const c = { name: 'c', ref: b };
  a.ref = c; // Create a -> c -> b -> a cycle

  const encoded = encode(a);
  const decoded = decode(encoded);

  assert.equal(decoded.name, 'a');
  assert.equal(decoded.ref.name, 'c');
  assert.equal(decoded.ref.ref.name, 'b');
  assert.equal(decoded.ref.ref.ref, decoded); // Full circle
});

test('array and object circular reference', () => {
  const obj = { name: 'obj' };
  const arr = [1, obj];
  obj.arr = arr; // obj -> arr -> obj

  const encoded = encode(obj);
  const decoded = decode(encoded);

  assert.equal(decoded.name, 'obj');
  assert.ok(Array.isArray(decoded.arr));
  assert.equal(decoded.arr[0], 1);
  assert.equal(decoded.arr[1], decoded); // Circular reference
});
