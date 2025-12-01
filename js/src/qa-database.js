/**
 * Q&A Database module using Links Notation parser.
 * Manages reading and writing Q&A pairs from .lino files.
 *
 * IMPORTANT: This module REQUIRES explicit file path configuration!
 * Use createQADatabase(filePath) to create an instance.
 *
 * ============================================================================
 * LINKS NOTATION FORMAT - Multiline Support
 * ============================================================================
 *
 * Links Notation NATIVELY supports multiline strings through indentation:
 *
 * Format:
 *   Question (no indentation)
 *     Answer line 1 (2 spaces)
 *     Answer line 2 (2 spaces)
 *     Answer line 3 (2 spaces)
 *
 * Key Features:
 * - Questions are NOT indented (0 spaces)
 * - Answers are indented with exactly 2 spaces
 * - Multiline answers: EVERY line must have 2-space indentation
 * - Newlines are preserved NATURALLY - DO NOT use \n escaping!
 * - Only quote characters (") need escaping if present in content
 *
 * Example:
 *   What is your experience?
 *     I have worked with:
 *     - JavaScript for 5 years
 *     - Python for 3 years
 *
 * This format preserves multiline content without any special escape sequences.
 * ============================================================================
 *
 * Based on the implementation from:
 * https://github.com/konard/hh-job-application-automation/blob/main/src/qa-database.mjs
 */

import { Parser } from 'links-notation';
import fs from 'fs/promises';
import path from 'path';

/**
 * Creates a Q&A database instance with the specified file path.
 * @param {string} filePath - REQUIRED: Path to the qa.lino file
 * @returns {Object} Q&A database instance with methods
 * @throws {Error} If filePath is not provided
 */
export function createQADatabase(filePath) {
  if (!filePath) {
    throw new Error(
      'CRITICAL: QA Database file path is REQUIRED!\n' +
        'Usage: createQADatabase("/path/to/qa.lino")\n' +
        'This prevents accidental usage without explicit path configuration.'
    );
  }

  const QA_FILE_PATH = filePath;

  // Lock management for preventing concurrent file access
  const locks = new Map();

  /**
   * Acquires a lock for a given key.
   * @param {string} key - The lock key
   * @returns {Promise<Function>} Release function
   */
  async function acquireLock(key) {
    while (locks.has(key)) {
      // Wait for the current lock to be released
      await locks.get(key);
    }

    // Create a new lock
    let releaseLock;
    const lockPromise = new Promise(resolve => {
      releaseLock = resolve;
    });

    locks.set(key, lockPromise);

    // Return the release function
    return releaseLock;
  }

  /**
   * Releases a lock for a given key.
   * @param {string} key - The lock key
   * @param {Function} releaseFn - The release function returned by acquireLock
   */
  function releaseLock(key, releaseFn) {
    locks.delete(key);
    releaseFn();
  }

  /**
   * Escapes a link reference for safe use in Links Notation format.
   *
   * IMPORTANT: Link references cannot contain certain characters unquoted:
   * - Newlines (\n) - must be quoted to preserve as single reference
   * - Quotes (" or ') - must be wrapped and escaped
   * - Colons (:) - delimiter for self-reference, must be quoted in content
   * - Parentheses (()) - borders of nested links, must be quoted in content
   *
   * @param {string} str - String to format (preserves newlines as-is)
   * @returns {string} Escaped link reference (may be quoted if needed)
   */
  function escapeReference(str) {
    // Check for characters that need quoting
    const hasColon = str.includes(':');
    const hasDoubleQuotes = str.includes('"');
    const hasSingleQuotes = str.includes("'");
    const hasParens = str.includes('(') || str.includes(')');
    const hasNewline = str.includes('\n');

    const needsQuoting = hasColon || hasDoubleQuotes || hasSingleQuotes || hasParens || hasNewline;

    if (needsQuoting) {
      if (hasDoubleQuotes && !hasSingleQuotes) {
        // Has " but not ' → use single quotes
        return `'${str}'`;
      } else if (hasSingleQuotes && !hasDoubleQuotes) {
        // Has ' but not " → use double quotes
        return `"${str}"`;
      } else if (hasDoubleQuotes && hasSingleQuotes) {
        // Has both " and ' → choose the wrapper with fewer escapes needed
        const doubleQuoteCount = (str.match(/"/g) || []).length;
        const singleQuoteCount = (str.match(/'/g) || []).length;

        if (singleQuoteCount < doubleQuoteCount) {
          // Fewer single quotes → wrap with " and escape ' as ''
          const escaped = str.replace(/'/g, "''");
          return `"${escaped}"`;
        } else {
          // Fewer or equal double quotes → wrap with ' and escape " as ""
          const escaped = str.replace(/"/g, '""');
          return `'${escaped}'`;
        }
      } else {
        // Has colon, parentheses, or newlines but no quotes → use double quotes
        return `"${str}"`;
      }
    }

    // No special characters - no quoting needed
    return str;
  }

  /**
   * Unescapes a link reference from Links Notation format.
   *
   * IMPORTANT: Links Notation naturally preserves newlines!
   * - Multiline content is already in the string as actual newlines
   * - Unescape doubled quotes: "" → " and '' → '
   *
   * @param {string} str - Link reference to unescape
   * @returns {string} Unescaped link reference
   */
  function unescapeReference(str) {
    if (!str) return str;

    // Unescape doubled quotes (Links Notation escape sequences)
    let unescaped = str.replace(/""/g, '"'); // "" → "
    unescaped = unescaped.replace(/''/g, "'"); // '' → '

    return unescaped;
  }

  /**
   * Extracts text from a Link object.
   *
   * IMPORTANT: Links Notation multiline support:
   * - Quoted multiline: "text\nline2" - parser preserves actual newlines in .id
   * - Indented multiline: Parser concatenates all indented lines into word tokens
   *
   * @param {Object} link - The link to extract text from
   * @returns {string} The extracted text
   */
  function extractText(link) {
    if (!link) return '';

    let text = '';

    if (link.id && (!link.values || link.values.length === 0)) {
      // Single value with .id (might contain actual newlines if quoted)
      text = link.id;
    } else if (!link.id && link.values && link.values.length > 0) {
      // Multiple word tokens - join with spaces
      text = link.values.map(v => extractText(v)).join(' ');
    } else if (link.id) {
      text = link.id;
    }

    // Unescape the text before returning
    return unescapeReference(text);
  }

  /**
   * Reads Q&A pairs from the .lino file.
   *
   * IMPORTANT: Links Notation multiline indented format:
   * - Each indented line creates a SEPARATE link with the same question
   * - Multiple short answers (< 150 chars, unquoted) are kept as array (checkbox options)
   * - Multiple long/quoted answers are combined with newlines (multiline text)
   *
   * @returns {Promise<Map<string, string|Array<string>>>} Map of questions to answers
   */
  async function readQADatabase() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(QA_FILE_PATH), { recursive: true });

      // Try to read the file
      const content = await fs.readFile(QA_FILE_PATH, 'utf8');

      // Parse using Links Notation
      const parser = new Parser();
      const links = parser.parse(content);

      // Extract Q&A pairs from parsed links
      const qaMap = new Map();
      const answersByQuestion = new Map();

      for (const link of links) {
        if (link._isFromPathCombination && link.values && link.values.length === 2) {
          const question = extractText(link.values[0]);
          const answer = extractText(link.values[1]);

          if (question && answer) {
            if (!answersByQuestion.has(question)) {
              answersByQuestion.set(question, []);
            }
            answersByQuestion.get(question).push(answer);
          }
        }
      }

      // Process collected answers
      for (const [question, answers] of answersByQuestion.entries()) {
        if (answers.length === 1) {
          // Single answer - store as-is
          qaMap.set(question, answers[0]);
        } else {
          // Multiple answers - check if they're checkbox options or multiline text
          const allShort = answers.every(a => a.length < 150);
          const anyQuoted = answers.some(
            a =>
              (a.startsWith('"') && a.endsWith('"')) || (a.startsWith("'") && a.endsWith("'"))
          );

          if (allShort && !anyQuoted) {
            // Likely checkbox options - store as array
            qaMap.set(question, answers);
          } else {
            // Multiline text - concatenate with newlines
            qaMap.set(question, answers.join('\n'));
          }
        }
      }

      return qaMap;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, return empty map
        return new Map();
      }

      console.error('Error reading Q&A database:', error);
      return new Map();
    }
  }

  /**
   * Writes Q&A pairs to the .lino file.
   *
   * IMPORTANT: Links Notation multiline format:
   * - Questions are not indented
   * - Answers are indented with 2 spaces
   * - If answer contains newlines, EVERY line must be indented with 2 spaces
   * - If answer is an array (checkboxes), each option on separate indented line
   *
   * Optimization: Skips writing if content is unchanged.
   *
   * @param {Map<string, string|Array<string>>} qaMap - Map of questions to answers
   */
  async function writeQADatabase(qaMap) {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(QA_FILE_PATH), { recursive: true });

      // Format as indented Q&A pairs with proper multiline handling
      const lines = [];
      for (const [question, answer] of qaMap.entries()) {
        // Question handling: escapeReference handles all cases including multiline
        const escapedQuestion = escapeReference(question);
        lines.push(escapedQuestion);

        // Answer handling:
        // - If answer is an array (checkbox options), write each on separate line
        // - If answer is quoted string, write as single quoted multiline
        // - Otherwise, split by newlines and indent each line with 2 spaces
        if (Array.isArray(answer)) {
          // Array of checkbox options - each on separate line
          for (const option of answer) {
            const escapedOption = escapeReference(option);
            lines.push(`  ${escapedOption}`);
          }
        } else {
          const escapedAnswer = escapeReference(answer);
          const isQuoted = escapedAnswer.startsWith('"') || escapedAnswer.startsWith("'");

          if (isQuoted) {
            // Quoted answer - write as-is with 2-space indent
            lines.push(`  ${escapedAnswer}`);
          } else {
            // Unquoted answer - split by newlines and indent each line
            const answerLines = escapedAnswer.split('\n');
            for (const answerLine of answerLines) {
              lines.push(`  ${answerLine}`);
            }
          }
        }
      }

      const newContent = lines.join('\n') + '\n';

      // Check if content has changed - skip write if identical
      let existingContent = '';
      try {
        existingContent = await fs.readFile(QA_FILE_PATH, 'utf8');
      } catch {
        // File doesn't exist yet, will be created
      }

      if (existingContent === newContent) {
        // No changes - skip write operation
        return;
      }

      // Write new content
      await fs.writeFile(QA_FILE_PATH, newContent, 'utf8');
    } catch (error) {
      console.error('Error writing Q&A database:', error);
      throw error;
    }
  }

  /**
   * Adds or updates a Q&A pair in the database.
   * Uses file locking to prevent race conditions.
   * @param {string} question - The question
   * @param {string} answer - The answer
   */
  async function addOrUpdateQA(question, answer) {
    const lockKey = 'qa-database';
    const release = await acquireLock(lockKey);

    try {
      const qaMap = await readQADatabase();
      qaMap.set(question, answer);
      await writeQADatabase(qaMap);
    } finally {
      releaseLock(lockKey, release);
    }
  }

  /**
   * Gets the answer for a given question.
   * @param {string} question - The question
   * @returns {Promise<string|Array<string>|null>} The answer, or null if not found
   */
  async function getAnswer(question) {
    const qaMap = await readQADatabase();
    return qaMap.get(question) || null;
  }

  /**
   * Deletes a Q&A pair from the database.
   * @param {string} question - The question to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async function deleteQA(question) {
    const lockKey = 'qa-database';
    const release = await acquireLock(lockKey);

    try {
      const qaMap = await readQADatabase();
      const existed = qaMap.has(question);
      qaMap.delete(question);
      await writeQADatabase(qaMap);
      return existed;
    } finally {
      releaseLock(lockKey, release);
    }
  }

  /**
   * Gets all Q&A pairs from the database.
   * @returns {Promise<Map<string, string|Array<string>>>} Map of all Q&A pairs
   */
  async function getAllQA() {
    return await readQADatabase();
  }

  // Return the public API
  return {
    readQADatabase,
    writeQADatabase,
    addOrUpdateQA,
    getAnswer,
    deleteQA,
    getAllQA,
    filePath: QA_FILE_PATH,
  };
}
