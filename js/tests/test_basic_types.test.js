/**
 * Tests for encoding/decoding basic JavaScript types.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode } from '../src/index.js';

// Tests for null type serialization
test('encode null', () => {
  const result = encode(null);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode null', () => {
  const encoded = encode(null);
  const result = decode(encoded);
  assert.equal(result, null);
});

test('roundtrip null', () => {
  const original = null;
  const encoded = encode(original);
  const decoded = decode(encoded);
  assert.equal(decoded, original);
});

// Tests for undefined type serialization
test('encode undefined', () => {
  const result = encode(undefined);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode undefined', () => {
  const encoded = encode(undefined);
  const result = decode(encoded);
  assert.equal(result, undefined);
});

test('roundtrip undefined', () => {
  const original = undefined;
  const encoded = encode(original);
  const decoded = decode(encoded);
  assert.equal(decoded, original);
});

// Tests for boolean type serialization
test('encode true', () => {
  const result = encode(true);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('encode false', () => {
  const result = encode(false);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode true', () => {
  const encoded = encode(true);
  const result = decode(encoded);
  assert.equal(result, true);
});

test('decode false', () => {
  const encoded = encode(false);
  const result = decode(encoded);
  assert.equal(result, false);
});

test('roundtrip bool', () => {
  for (const value of [true, false]) {
    const encoded = encode(value);
    const decoded = decode(encoded);
    assert.equal(decoded, value);
    assert.equal(typeof decoded, typeof value);
  }
});

// Tests for integer type serialization
test('encode zero', () => {
  const result = encode(0);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('encode positive int', () => {
  const result = encode(42);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('encode negative int', () => {
  const result = encode(-42);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode int', () => {
  for (const value of [0, 42, -42, 999999]) {
    const encoded = encode(value);
    const result = decode(encoded);
    assert.equal(result, value);
    assert.equal(typeof result, 'number');
  }
});

test('roundtrip int', () => {
  const testValues = [0, 1, -1, 42, -42, 123456789, -123456789];
  for (const value of testValues) {
    const encoded = encode(value);
    const decoded = decode(encoded);
    assert.equal(decoded, value);
    assert.equal(typeof decoded, 'number');
  }
});

// Tests for float type serialization
test('encode float', () => {
  const result = encode(3.14);
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode float', () => {
  const encoded = encode(3.14);
  const result = decode(encoded);
  assert.equal(Math.abs(result - 3.14) < 0.0001, true);
  assert.equal(typeof result, 'number');
});

test('roundtrip float', () => {
  const testValues = [0.0, 1.0, -1.0, 3.14, -3.14, 0.123456789, -999.999];
  for (const value of testValues) {
    const encoded = encode(value);
    const decoded = decode(encoded);
    assert.equal(Math.abs(decoded - value) < 0.0001, true);
    assert.equal(typeof decoded, 'number');
  }
});

test('float special values', () => {
  // Test infinity
  const infEncoded = encode(Infinity);
  assert.equal(decode(infEncoded), Infinity);

  // Test negative infinity
  const negInfEncoded = encode(-Infinity);
  assert.equal(decode(negInfEncoded), -Infinity);

  // Test NaN (special case: NaN !== NaN, so we check with isNaN)
  const nanEncoded = encode(NaN);
  assert.ok(Number.isNaN(decode(nanEncoded)));
});

// Tests for string type serialization
test('encode empty string', () => {
  const result = encode('');
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('encode simple string', () => {
  const result = encode('hello');
  assert.ok(result);
  assert.equal(typeof result, 'string');
});

test('decode string', () => {
  const encoded = encode('hello world');
  const result = decode(encoded);
  assert.equal(result, 'hello world');
  assert.equal(typeof result, 'string');
});

test('roundtrip string', () => {
  const testValues = [
    '',
    'hello',
    'hello world',
    'Hello, World!',
    'multi\nline\nstring',
    'tab\tseparated',
    'unicode: 你好世界 🌍',
    'special chars: @#$%^&*()',
  ];
  for (const value of testValues) {
    const encoded = encode(value);
    const decoded = decode(encoded);
    assert.equal(decoded, value);
    assert.equal(typeof decoded, 'string');
  }
});

test('string with quotes', () => {
  const testValues = [
    "string with 'single quotes'",
    'string with "double quotes"',
    `string with "both" 'quotes'`,
  ];
  for (const value of testValues) {
    const encoded = encode(value);
    const decoded = decode(encoded);
    assert.equal(decoded, value);
  }
});
