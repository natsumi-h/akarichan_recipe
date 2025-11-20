/**
 * String utility functions for search normalization
 */

/**
 * Convert katakana to hiragana
 * Example: "カタカナ" -> "かたかな"
 */
export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

/**
 * Normalize search query for better matching
 * - Converts katakana to hiragana
 * - Converts full-width alphanumeric to half-width
 * - Converts to lowercase
 * - Trims whitespace
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return '';

  let normalized = query;

  // 1. Convert katakana to hiragana
  normalized = katakanaToHiragana(normalized);

  // 2. Convert full-width alphanumeric to half-width
  normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });

  // 3. Convert to lowercase
  normalized = normalized.toLowerCase();

  // 4. Trim whitespace
  normalized = normalized.trim();

  return normalized;
}

/**
 * Generate multiple query variations for flexible matching
 * Returns both normalized and original queries
 */
export function generateQueryVariations(query: string): string[] {
  const variations = new Set<string>();

  // Original query
  variations.add(query);

  // Normalized query
  const normalized = normalizeSearchQuery(query);
  if (normalized !== query) {
    variations.add(normalized);
  }

  return Array.from(variations);
}
