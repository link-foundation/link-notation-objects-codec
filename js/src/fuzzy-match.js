/**
 * Fuzzy matching utilities for string comparison.
 *
 * These utilities are useful for finding similar questions in a Q&A database
 * when an exact match is not found.
 *
 * Based on the implementation from:
 * https://github.com/konard/hh-job-application-automation/blob/main/src/qa-database.mjs
 */

/**
 * Calculate Levenshtein distance between two strings.
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another.
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance between the strings
 */
export function levenshteinDistance(a, b) {
  const matrix = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1).
 * Uses Levenshtein distance normalized by the maximum string length.
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity score (0 = completely different, 1 = identical)
 */
export function stringSimilarity(a, b) {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

/**
 * Default set of Russian stopwords.
 * These common words are filtered out when extracting keywords.
 */
export const DEFAULT_STOPWORDS_RU = new Set([
  'пожалуйста',
  'свои',
  'ваши',
  'от',
  'до',
  'в',
  'на',
  'с',
  'по',
  'о',
  'об',
  'и',
  'а',
  'но',
  'или',
  'то',
  'как',
  'что',
  'это',
  'вы',
  'ты',
  'он',
  'она',
  'они',
  'мы',
  'я',
  'к',
  'для',
  'при',
  'чуть',
  'данный',
  'момент',
]);

/**
 * Default set of English stopwords.
 * These common words are filtered out when extracting keywords.
 */
export const DEFAULT_STOPWORDS_EN = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'can',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'you',
  'your',
  'we',
  'our',
  'they',
  'their',
  'he',
  'his',
  'she',
  'her',
  'i',
  'my',
  'me',
  'what',
  'which',
  'who',
  'whom',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'not',
  'only',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'about',
]);

/**
 * Normalize a question string for comparison.
 * Converts to lowercase, removes punctuation, and standardizes spacing.
 *
 * @param {string} question - Question to normalize
 * @returns {string} Normalized question
 */
export function normalizeQuestion(question) {
  return question
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract key words from a question, filtering out stopwords.
 *
 * @param {string} question - Question string
 * @param {Object} options - Options
 * @param {Set<string>} [options.stopwords] - Custom stopwords set (default: combined RU + EN)
 * @param {number} [options.minWordLength=2] - Minimum word length to include
 * @param {number} [options.stemLength=5] - Length to truncate words for stemming (0 to disable)
 * @returns {Set<string>} Set of key words
 */
export function extractKeywords(question, options = {}) {
  const stopwords = options.stopwords || new Set([...DEFAULT_STOPWORDS_RU, ...DEFAULT_STOPWORDS_EN]);
  const minWordLength = options.minWordLength ?? 2;
  const stemLength = options.stemLength ?? 5;

  const normalized = normalizeQuestion(question);
  const words = normalized.split(/\s+/);

  const keywords = new Set(
    words.filter(word => word.length > minWordLength && !stopwords.has(word))
  );

  // Add stems for longer words to improve matching
  if (stemLength > 0) {
    const stems = new Set();
    for (const word of keywords) {
      if (word.length > stemLength + 1) {
        stems.add(word.substring(0, stemLength));
      }
    }
    return new Set([...keywords, ...stems]);
  }

  return keywords;
}

/**
 * Calculate keyword overlap similarity (Jaccard index).
 *
 * @param {string} a - First question
 * @param {string} b - Second question
 * @param {Object} [options] - Options passed to extractKeywords
 * @returns {number} Similarity score (0-1)
 */
export function keywordSimilarity(a, b, options = {}) {
  const keywordsA = extractKeywords(a, options);
  const keywordsB = extractKeywords(b, options);

  if (keywordsA.size === 0 && keywordsB.size === 0) return 1.0;
  if (keywordsA.size === 0 || keywordsB.size === 0) return 0.0;

  const intersection = new Set([...keywordsA].filter(x => keywordsB.has(x)));
  const union = new Set([...keywordsA, ...keywordsB]);

  return intersection.size / union.size;
}

/**
 * Find the best matching question from a database using fuzzy matching.
 * Combines edit distance similarity (40% weight) and keyword overlap (60% weight).
 *
 * @param {string} question - Question to match
 * @param {Map<string, *>} qaDatabase - Q&A database (Map of questions to answers)
 * @param {Object} [options] - Options
 * @param {number} [options.threshold=0.4] - Minimum similarity threshold (0-1)
 * @param {number} [options.editWeight=0.4] - Weight for edit distance similarity
 * @param {number} [options.keywordWeight=0.6] - Weight for keyword similarity
 * @returns {{question: string, answer: *, score: number} | null} Best match or null
 */
export function findBestMatch(question, qaDatabase, options = {}) {
  const threshold = options.threshold ?? 0.4;
  const editWeight = options.editWeight ?? 0.4;
  const keywordWeight = options.keywordWeight ?? 0.6;

  // Check for exact match first
  if (qaDatabase.has(question)) {
    return { question, answer: qaDatabase.get(question), score: 1.0 };
  }

  let bestMatch = null;
  let bestScore = threshold;

  for (const [dbQuestion, answer] of qaDatabase.entries()) {
    const editSimilarity = stringSimilarity(normalizeQuestion(question), normalizeQuestion(dbQuestion));
    const kwSimilarity = keywordSimilarity(question, dbQuestion);

    const combinedScore = editSimilarity * editWeight + kwSimilarity * keywordWeight;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = { question: dbQuestion, answer, score: combinedScore };
    }
  }

  return bestMatch;
}

/**
 * Find all matches above a threshold, sorted by score (descending).
 *
 * @param {string} question - Question to match
 * @param {Map<string, *>} qaDatabase - Q&A database
 * @param {Object} [options] - Options (same as findBestMatch)
 * @returns {Array<{question: string, answer: *, score: number}>} Matches sorted by score
 */
export function findAllMatches(question, qaDatabase, options = {}) {
  const threshold = options.threshold ?? 0.4;
  const editWeight = options.editWeight ?? 0.4;
  const keywordWeight = options.keywordWeight ?? 0.6;

  const matches = [];

  for (const [dbQuestion, answer] of qaDatabase.entries()) {
    let score;

    if (dbQuestion === question) {
      score = 1.0;
    } else {
      const editSimilarity = stringSimilarity(
        normalizeQuestion(question),
        normalizeQuestion(dbQuestion)
      );
      const kwSimilarity = keywordSimilarity(question, dbQuestion);
      score = editSimilarity * editWeight + kwSimilarity * keywordWeight;
    }

    if (score >= threshold) {
      matches.push({ question: dbQuestion, answer, score });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}
