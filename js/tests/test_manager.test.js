/**
 * Tests for LinksNotationManager class.
 * Based on tests from: https://github.com/konard/follow/blob/main/lino.lib.test.mjs
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LinksNotationManager, lino } from '../src/index.js';

describe('LinksNotationManager', () => {
  let manager;
  let testStorageDir;

  beforeEach(() => {
    manager = new LinksNotationManager();
    // Use a temporary test directory
    testStorageDir = path.join(os.tmpdir(), 'lino-test-' + Date.now() + '-' + Math.random().toString(36).substring(7));
    manager.storageDir = testStorageDir;
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  describe('parse', () => {
    test('should parse empty input', () => {
      assert.deepEqual(manager.parse(''), []);
      assert.deepEqual(manager.parse(null), []);
      assert.deepEqual(manager.parse(undefined), []);
    });

    test('should parse simple Links Notation', () => {
      const result = manager.parse('(a b c)');
      assert.equal(result.length, 3);
    });

    test('should parse single value', () => {
      const result = manager.parse('(value)');
      assert.ok(result.length > 0);
    });
  });

  describe('parseNumericIds', () => {
    test('should parse numeric IDs from Links Notation', () => {
      const result = manager.parseNumericIds('(123 456 789)');
      assert.deepEqual(result, [123, 456, 789]);
    });

    test('should handle empty input', () => {
      assert.deepEqual(manager.parseNumericIds(''), []);
      assert.deepEqual(manager.parseNumericIds(null), []);
    });

    test('should filter out non-numeric values', () => {
      const result = manager.parseNumericIds('(123 abc 456)');
      assert.ok(result.includes(123));
      assert.ok(result.includes(456));
    });
  });

  describe('parseStringValues', () => {
    test('should parse string values from Links Notation', () => {
      const result = manager.parseStringValues('(hello world test)');
      assert.ok(result.includes('hello'));
      assert.ok(result.includes('world'));
      assert.ok(result.includes('test'));
    });

    test('should handle empty input', () => {
      assert.deepEqual(manager.parseStringValues(''), []);
      assert.deepEqual(manager.parseStringValues(null), []);
    });
  });

  describe('format', () => {
    test('should format empty array', () => {
      assert.equal(manager.format([]), '()');
      assert.equal(manager.format(null), '()');
    });

    test('should format array with values', () => {
      const result = manager.format(['a', 'b', 'c']);
      assert.ok(result.includes('a'));
      assert.ok(result.includes('b'));
      assert.ok(result.includes('c'));
      assert.ok(result.startsWith('('));
      assert.ok(result.endsWith(')'));
    });

    test('should format with proper indentation', () => {
      const result = manager.format([1, 2, 3]);
      assert.match(result, /\(\n  1\n  2\n  3\n\)/);
    });
  });

  describe('escapeReference', () => {
    test('should not escape numbers', () => {
      assert.equal(manager.escapeReference(123), '123');
      assert.equal(manager.escapeReference(45.67), '45.67');
    });

    test('should not escape booleans', () => {
      assert.equal(manager.escapeReference(true), 'true');
      assert.equal(manager.escapeReference(false), 'false');
    });

    test('should not escape simple strings', () => {
      assert.equal(manager.escapeReference('hello'), 'hello');
      assert.equal(manager.escapeReference('test123'), 'test123');
    });

    test('should escape strings with spaces using single quotes', () => {
      assert.equal(manager.escapeReference('hello world'), "'hello world'");
    });

    test('should escape strings with single quotes using double quotes', () => {
      assert.equal(manager.escapeReference("it's"), '"it\'s"');
    });

    test('should escape strings with double quotes using single quotes', () => {
      assert.equal(manager.escapeReference('say "hello"'), '\'say "hello"\'');
    });

    test('should minimize escaping when both quotes present', () => {
      // More single quotes -> use double quotes
      const result1 = manager.escapeReference("it's a 'test' string");
      assert.ok(result1.startsWith('"'));

      // More double quotes -> use single quotes
      const result2 = manager.escapeReference('say "hello" and "world"');
      assert.ok(result2.startsWith("'"));
    });

    test('should escape strings with parentheses', () => {
      assert.equal(manager.escapeReference('(test)'), "'(test)'");
    });
  });

  describe('jsonToLino', () => {
    test('should convert null', () => {
      assert.equal(manager.jsonToLino(null), 'null');
      assert.equal(manager.jsonToLino(undefined), 'null');
    });

    test('should convert numbers', () => {
      assert.equal(manager.jsonToLino(123), '123');
      assert.equal(manager.jsonToLino(45.67), '45.67');
    });

    test('should convert booleans', () => {
      assert.equal(manager.jsonToLino(true), 'true');
      assert.equal(manager.jsonToLino(false), 'false');
    });

    test('should convert simple strings', () => {
      assert.equal(manager.jsonToLino('hello'), 'hello');
    });

    test('should convert strings with spaces', () => {
      assert.equal(manager.jsonToLino('hello world'), "'hello world'");
    });

    test('should convert empty array', () => {
      assert.equal(manager.jsonToLino([]), '()');
    });

    test('should convert array with primitives', () => {
      const result = manager.jsonToLino([1, 2, 3]);
      assert.equal(result, '(1 2 3)');
    });

    test('should convert array with strings', () => {
      const result = manager.jsonToLino(['a', 'b', 'c']);
      assert.equal(result, '(a b c)');
    });

    test('should convert empty object', () => {
      assert.equal(manager.jsonToLino({}), '()');
    });

    test('should convert simple object', () => {
      const result = manager.jsonToLino({ name: 'John', age: 30 });
      assert.ok(result.includes('name'));
      assert.ok(result.includes('John'));
      assert.ok(result.includes('age'));
      assert.ok(result.includes('30'));
    });

    test('should convert object with string value containing spaces', () => {
      const result = manager.jsonToLino({ name: 'John Doe' });
      assert.ok(result.includes("'John Doe'"));
    });

    test('should convert nested objects', () => {
      const result = manager.jsonToLino({
        user: { name: 'Alice', age: 25 },
      });
      assert.ok(result.includes('user'));
      assert.ok(result.includes('name'));
      assert.ok(result.includes('Alice'));
    });

    test('should convert nested arrays', () => {
      const result = manager.jsonToLino([
        [1, 2],
        [3, 4],
      ]);
      assert.equal(result, '((1 2) (3 4))');
    });

    test('should convert complex nested structure', () => {
      const result = manager.jsonToLino({
        users: [
          { name: 'Alice', age: 25 },
          { name: 'Bob', age: 30 },
        ],
      });
      assert.ok(result.includes('users'));
      assert.ok(result.includes('Alice'));
      assert.ok(result.includes('Bob'));
    });

    test('should convert object with boolean values', () => {
      const result = manager.jsonToLino({ active: true, deleted: false });
      assert.ok(result.includes('true'));
      assert.ok(result.includes('false'));
    });
  });

  describe('linoToJson', () => {
    test('should convert null', () => {
      assert.equal(manager.linoToJson('null'), null);
    });

    test('should handle empty or invalid input', () => {
      assert.equal(manager.linoToJson(''), null);
      assert.equal(manager.linoToJson(null), null);
    });

    test('should convert numbers', () => {
      assert.equal(manager.linoToJson('123'), 123);
      assert.equal(manager.linoToJson('45.67'), 45.67);
    });

    test('should convert booleans', () => {
      assert.equal(manager.linoToJson('true'), true);
      assert.equal(manager.linoToJson('false'), false);
    });

    test('should convert strings', () => {
      assert.equal(manager.linoToJson('hello'), 'hello');
    });

    test('should convert empty link to array', () => {
      assert.deepEqual(manager.linoToJson('()'), []);
    });

    test('should convert link with primitives to array', () => {
      assert.deepEqual(manager.linoToJson('(1 2 3)'), [1, 2, 3]);
    });

    test('should convert wrapped pairs to object', () => {
      const result = manager.linoToJson('((name John) (age 30))');
      assert.deepEqual(result, { name: 'John', age: 30 });
    });

    test('should convert nested structures', () => {
      const result = manager.linoToJson('((1 2) (3 4))');
      assert.deepEqual(result, [
        [1, 2],
        [3, 4],
      ]);
    });

    test('should handle odd number of elements as array', () => {
      const result = manager.linoToJson('(1 2 3)');
      assert.ok(Array.isArray(result));
    });
  });

  describe('jsonToLino and linoToJson round-trip', () => {
    test('should round-trip simple object', () => {
      const original = { name: 'John', age: 30, active: true };
      const linoStr = manager.jsonToLino(original);
      const result = manager.linoToJson(linoStr);
      assert.deepEqual(result, original);
    });

    test('should round-trip nested object', () => {
      const original = {
        user: { name: 'Alice', age: 25 },
        settings: { theme: 'dark', notifications: true },
      };
      const linoStr = manager.jsonToLino(original);
      const result = manager.linoToJson(linoStr);
      assert.deepEqual(result, original);
    });

    test('should round-trip array', () => {
      const original = [1, 2, 3, 4, 5];
      const linoStr = manager.jsonToLino(original);
      const result = manager.linoToJson(linoStr);
      assert.deepEqual(result, original);
    });

    test('should round-trip complex structure', () => {
      const original = {
        totalSent: 4,
        survived: 4,
        deleted: 0,
        skipped: 0,
        deletedForRetry: 0,
        needsRetry: false,
      };
      const linoStr = manager.jsonToLino(original);
      const result = manager.linoToJson(linoStr);
      assert.deepEqual(result, original);
    });
  });

  describe('ensureDir', () => {
    test('should create storage directory if not exists', () => {
      assert.equal(fs.existsSync(testStorageDir), false);
      const created = manager.ensureDir();
      assert.equal(fs.existsSync(testStorageDir), true);
      assert.equal(created, true);
    });

    test('should return false if directory already exists', () => {
      manager.ensureDir();
      const created = manager.ensureDir();
      assert.equal(created, false);
    });
  });

  describe('saveAsLino and loadFromLino', () => {
    test('should save and load array values', () => {
      const values = [1, 2, 3, 4, 5];
      manager.saveAsLino('test.lino', values);

      const loaded = manager.loadFromLino('test.lino');
      assert.deepEqual(loaded.numericIds, values);
    });

    test('should return null for non-existent file', () => {
      const loaded = manager.loadFromLino('nonexistent.lino');
      assert.equal(loaded, null);
    });

    test('should save string values', () => {
      const values = ['a', 'b', 'c'];
      manager.saveAsLino('strings.lino', values);

      const loaded = manager.loadFromLino('strings.lino');
      assert.ok(loaded.stringValues.includes('a'));
      assert.ok(loaded.stringValues.includes('b'));
      assert.ok(loaded.stringValues.includes('c'));
    });
  });

  describe('saveJsonAsLino and loadJsonFromLino', () => {
    test('should save and load structured data', () => {
      const data = {
        totalSent: 4,
        survived: 4,
        deleted: 0,
        needsRetry: false,
      };

      manager.saveJsonAsLino('results.lino', data);
      const loaded = manager.loadJsonFromLino('results.lino');

      assert.deepEqual(loaded, data);
    });

    test('should return null for non-existent file', () => {
      const loaded = manager.loadJsonFromLino('nonexistent.lino');
      assert.equal(loaded, null);
    });

    test('should handle complex nested data', () => {
      const data = {
        user: { name: 'Alice', age: 25 },
        active: true,
        tags: ['admin', 'user'],
      };

      manager.saveJsonAsLino('complex.lino', data);
      const loaded = manager.loadJsonFromLino('complex.lino');

      assert.deepEqual(loaded, data);
    });
  });

  describe('fileExists', () => {
    test('should return false for non-existent file', () => {
      assert.equal(manager.fileExists('nonexistent.lino'), false);
    });

    test('should return true for existing file', () => {
      manager.saveAsLino('test.lino', [1, 2, 3]);
      assert.equal(manager.fileExists('test.lino'), true);
    });
  });

  describe('getFilePath', () => {
    test('should return full path to file', () => {
      const filePath = manager.getFilePath('test.lino');
      assert.equal(filePath, path.join(testStorageDir, 'test.lino'));
    });
  });
});

describe('lino singleton', () => {
  test('should be an instance of LinksNotationManager', () => {
    assert.ok(lino instanceof LinksNotationManager);
  });

  test('should have default storageDir in user home', () => {
    assert.equal(lino.storageDir, path.join(os.homedir(), '.follow'));
  });
});
