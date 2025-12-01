/**
 * Link Notation Objects Codec - Universal serializer/deserializer for JavaScript objects.
 *
 * This library provides:
 * - Typed serialization/deserialization of JavaScript objects to/from Links Notation format
 * - Support for circular references and complex object graphs
 * - LinksNotationManager for JSON/Lino conversion and file operations
 * - Q&A database functionality with locking and multiline support
 * - Fuzzy matching utilities for string comparison
 *
 * @module link-notation-objects-codec
 */

// Typed object codec (preserves types with markers like (int 42), (str base64))
export { ObjectCodec, encode, decode } from './codec.js';

// LinksNotationManager for JSON/Lino conversion and file operations
export { LinksNotationManager, lino } from './manager.js';

// Q&A Database functionality
export { createQADatabase } from './qa-database.js';

// Fuzzy matching utilities
export {
  levenshteinDistance,
  stringSimilarity,
  normalizeQuestion,
  extractKeywords,
  keywordSimilarity,
  findBestMatch,
  findAllMatches,
  DEFAULT_STOPWORDS_RU,
  DEFAULT_STOPWORDS_EN,
} from './fuzzy-match.js';
