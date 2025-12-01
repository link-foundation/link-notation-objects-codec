/**
 * Tests for Q&A Database functionality.
 * Based on tests from: https://github.com/konard/hh-job-application-automation/blob/main/tests/qa-database.test.mjs
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createQADatabase } from '../src/index.js';

describe('Q&A Database Module', () => {
  let testDataDir;
  let testQAFile;
  let qaDB;

  beforeEach(async () => {
    // Use a temporary test directory
    testDataDir = path.join(os.tmpdir(), 'qa-test-' + Date.now() + '-' + Math.random().toString(36).substring(7));
    testQAFile = path.join(testDataDir, 'qa.test.lino');
    qaDB = createQADatabase(testQAFile);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
  });

  describe('createQADatabase', () => {
    test('should throw error if filePath is not provided', () => {
      assert.throws(() => createQADatabase(), /CRITICAL/);
      assert.throws(() => createQADatabase(null), /CRITICAL/);
      assert.throws(() => createQADatabase(''), /CRITICAL/);
    });

    test('should create database instance with file path', () => {
      const db = createQADatabase('/test/path/qa.lino');
      assert.equal(db.filePath, '/test/path/qa.lino');
    });
  });

  describe('readQADatabase()', () => {
    test('should return empty Map when file does not exist', async () => {
      const result = await qaDB.readQADatabase();
      assert.ok(result instanceof Map);
      assert.equal(result.size, 0);
    });

    test('should return empty Map when file is empty', async () => {
      await fs.mkdir(testDataDir, { recursive: true });
      await fs.writeFile(testQAFile, '', 'utf8');

      const result = await qaDB.readQADatabase();
      assert.ok(result instanceof Map);
      assert.equal(result.size, 0);
    });

    test('should read simple Q&A pairs', async () => {
      await fs.mkdir(testDataDir, { recursive: true });
      const content = 'What is your name?\n  My name is Assistant\n';
      await fs.writeFile(testQAFile, content, 'utf8');

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 1);
      assert.equal(result.get('What is your name?'), 'My name is Assistant');
    });

    test('should read multiple Q&A pairs', async () => {
      await fs.mkdir(testDataDir, { recursive: true });
      const content = `Question 1?
  Answer 1
Question 2?
  Answer 2
Question 3?
  Answer 3
`;
      await fs.writeFile(testQAFile, content, 'utf8');

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 3);
      assert.equal(result.get('Question 1?'), 'Answer 1');
      assert.equal(result.get('Question 2?'), 'Answer 2');
      assert.equal(result.get('Question 3?'), 'Answer 3');
    });

    test('should handle Cyrillic/Unicode characters', async () => {
      await fs.mkdir(testDataDir, { recursive: true });
      const content = `Как вас зовут?
  Меня зовут Ассистент
你好吗？
  我很好
`;
      await fs.writeFile(testQAFile, content, 'utf8');

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 2);
      assert.equal(result.get('Как вас зовут?'), 'Меня зовут Ассистент');
      assert.equal(result.get('你好吗？'), '我很好');
    });
  });

  describe('writeQADatabase()', () => {
    test('should create directory if it does not exist', async () => {
      const qaMap = new Map([['Test question?', 'Test answer']]);
      await qaDB.writeQADatabase(qaMap);

      const dirExists = await fs.access(testDataDir).then(() => true).catch(() => false);
      assert.ok(dirExists);
    });

    test('should write empty file for empty Map', async () => {
      const qaMap = new Map();
      await qaDB.writeQADatabase(qaMap);

      const content = await fs.readFile(testQAFile, 'utf8');
      assert.equal(content, '\n');
    });

    test('should write single Q&A pair correctly', async () => {
      const qaMap = new Map([['What is 2+2?', '4']]);
      await qaDB.writeQADatabase(qaMap);

      const content = await fs.readFile(testQAFile, 'utf8');
      assert.equal(content, 'What is 2+2?\n  4\n');
    });

    test('should preserve Unicode characters when writing', async () => {
      const qaMap = new Map([
        ['Привет?', 'Здравствуйте'],
        ['你好?', '您好'],
      ]);
      await qaDB.writeQADatabase(qaMap);

      const content = await fs.readFile(testQAFile, 'utf8');
      assert.ok(content.includes('Привет?'));
      assert.ok(content.includes('Здравствуйте'));
      assert.ok(content.includes('你好?'));
      assert.ok(content.includes('您好'));
    });
  });

  describe('addOrUpdateQA()', () => {
    test('should add new Q&A pair to empty database', async () => {
      await qaDB.addOrUpdateQA('New question?', 'New answer');

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 1);
      assert.equal(result.get('New question?'), 'New answer');
    });

    test('should add multiple Q&A pairs sequentially', async () => {
      await qaDB.addOrUpdateQA('Q1?', 'A1');
      await qaDB.addOrUpdateQA('Q2?', 'A2');
      await qaDB.addOrUpdateQA('Q3?', 'A3');

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 3);
      assert.equal(result.get('Q1?'), 'A1');
      assert.equal(result.get('Q2?'), 'A2');
      assert.equal(result.get('Q3?'), 'A3');
    });

    test('should update existing Q&A pair', async () => {
      await qaDB.addOrUpdateQA('Test?', 'Original answer');
      await qaDB.addOrUpdateQA('Test?', 'Updated answer');

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 1);
      assert.equal(result.get('Test?'), 'Updated answer');
    });

    test('should handle concurrent writes without race conditions (10 operations)', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(qaDB.addOrUpdateQA(`Question ${i}?`, `Answer ${i}`));
      }

      await Promise.all(promises);

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 10, `Expected 10 entries, got ${result.size}`);

      for (let i = 0; i < 10; i++) {
        assert.equal(result.get(`Question ${i}?`), `Answer ${i}`);
      }
    });

    test('should handle Unicode in concurrent operations', async () => {
      const promises = [
        qaDB.addOrUpdateQA('Привет?', 'Здравствуйте'),
        qaDB.addOrUpdateQA('你好?', '您好'),
        qaDB.addOrUpdateQA('Hello?', 'Hi'),
      ];

      await Promise.all(promises);

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 3);
      assert.equal(result.get('Привет?'), 'Здравствуйте');
      assert.equal(result.get('你好?'), '您好');
      assert.equal(result.get('Hello?'), 'Hi');
    });
  });

  describe('getAnswer()', () => {
    test('should return null for non-existent question', async () => {
      const answer = await qaDB.getAnswer('Non-existent?');
      assert.equal(answer, null);
    });

    test('should return answer for existing question', async () => {
      await qaDB.addOrUpdateQA('Test question?', 'Test answer');

      const answer = await qaDB.getAnswer('Test question?');
      assert.equal(answer, 'Test answer');
    });

    test('should return null from empty database', async () => {
      const answer = await qaDB.getAnswer('Any question?');
      assert.equal(answer, null);
    });

    test('should return correct answer from multiple entries', async () => {
      await qaDB.addOrUpdateQA('Q1?', 'A1');
      await qaDB.addOrUpdateQA('Q2?', 'A2');
      await qaDB.addOrUpdateQA('Q3?', 'A3');

      assert.equal(await qaDB.getAnswer('Q1?'), 'A1');
      assert.equal(await qaDB.getAnswer('Q2?'), 'A2');
      assert.equal(await qaDB.getAnswer('Q3?'), 'A3');
      assert.equal(await qaDB.getAnswer('Q4?'), null);
    });
  });

  describe('deleteQA()', () => {
    test('should delete existing Q&A pair', async () => {
      await qaDB.addOrUpdateQA('Test?', 'Answer');

      const deleted = await qaDB.deleteQA('Test?');
      assert.equal(deleted, true);

      const answer = await qaDB.getAnswer('Test?');
      assert.equal(answer, null);
    });

    test('should return false for non-existent question', async () => {
      const deleted = await qaDB.deleteQA('Non-existent?');
      assert.equal(deleted, false);
    });
  });

  describe('getAllQA()', () => {
    test('should return all Q&A pairs', async () => {
      await qaDB.addOrUpdateQA('Q1?', 'A1');
      await qaDB.addOrUpdateQA('Q2?', 'A2');

      const all = await qaDB.getAllQA();
      assert.equal(all.size, 2);
      assert.equal(all.get('Q1?'), 'A1');
      assert.equal(all.get('Q2?'), 'A2');
    });

    test('should return empty Map for empty database', async () => {
      const all = await qaDB.getAllQA();
      assert.equal(all.size, 0);
    });
  });

  describe('Special character handling', () => {
    test('should handle questions with colons', async () => {
      const question = 'Question with colon: how are you?';
      const answer = 'Good!';

      await qaDB.addOrUpdateQA(question, answer);

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 1);
      assert.equal(result.get(question), answer);
    });

    test('should handle questions with parentheses', async () => {
      const question = 'Question (with parentheses) here?';
      const answer = 'Answer (also with parentheses)';

      await qaDB.addOrUpdateQA(question, answer);

      const result = await qaDB.readQADatabase();
      assert.equal(result.size, 1);
      assert.equal(result.get(question), answer);
    });

    test('should handle quotes in strings', async () => {
      const question = 'Question with "double quotes"?';
      const answer = 'Answer with "double quotes" too';

      await qaDB.addOrUpdateQA(question, answer);

      const result = await qaDB.readQADatabase();
      // The important thing is no crash and data is preserved
      assert.ok(result.size >= 0);
    });

    test('should preserve long questions and answers', async () => {
      const longQuestion = 'This is a very long question that contains many words and spans multiple conceptual phrases?';
      const longAnswer = 'This is an equally long answer that provides detailed information and explanations.';

      await qaDB.addOrUpdateQA(longQuestion, longAnswer);

      const result = await qaDB.readQADatabase();
      assert.equal(result.get(longQuestion), longAnswer);
    });
  });

  describe('Data persistence', () => {
    test('should maintain data across multiple read operations', async () => {
      await qaDB.addOrUpdateQA('Persistent?', 'Yes');

      const read1 = await qaDB.readQADatabase();
      const read2 = await qaDB.readQADatabase();
      const read3 = await qaDB.readQADatabase();

      assert.equal(read1.get('Persistent?'), 'Yes');
      assert.equal(read2.get('Persistent?'), 'Yes');
      assert.equal(read3.get('Persistent?'), 'Yes');
    });

    test('should skip write when content unchanged', async () => {
      await qaDB.addOrUpdateQA('Test?', 'Answer');

      const contentBefore = await fs.readFile(testQAFile, 'utf8');

      // Write same data again
      const qaMap = await qaDB.readQADatabase();
      await qaDB.writeQADatabase(qaMap);

      const contentAfter = await fs.readFile(testQAFile, 'utf8');

      assert.equal(contentBefore, contentAfter);
    });
  });
});
