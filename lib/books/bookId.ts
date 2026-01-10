/**
 * Book ID generation utilities
 *
 * Uses the same algorithm as squabble-react-native to ensure
 * cross-platform compatibility for comments and progress sync.
 */

/**
 * Simple string hash function (djb2 algorithm)
 * Produces a deterministic hash from a string
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit integer, then to base36 string
  return (hash >>> 0).toString(36);
}

/**
 * Normalize a string for consistent hashing
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters
 * - Collapse multiple spaces
 */
function normalizeForHash(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ');   // Collapse whitespace
}

/**
 * Generate a deterministic book ID from metadata
 * Same title + author = same ID across devices/platforms
 *
 * This matches the algorithm in squabble-react-native/packages/shared/src/models/book.ts
 */
export function generateBookIdFromMetadata(title: string, author?: string): string {
  const normalizedTitle = normalizeForHash(title);
  const normalizedAuthor = author ? normalizeForHash(author) : '';

  // Combine title and author for hashing
  const combined = `${normalizedTitle}|${normalizedAuthor}`;
  const hash = hashString(combined);

  return `book_${hash}`;
}

/**
 * Map of legacy IDs to new deterministic IDs
 * Used for migration and backwards compatibility
 */
export const LEGACY_ID_MAP: Record<string, string> = {
  'mage-tank-1': generateBookIdFromMetadata('Mage Tank', 'Cornman'),
  'mage-tank-2': generateBookIdFromMetadata('Mage Tank 2', 'Cornman'),
  'mage-tank-3': generateBookIdFromMetadata('Mage Tank 3', 'Cornman'),
};

/**
 * Convert a legacy book ID to the new deterministic format
 * Returns the original ID if no mapping exists
 */
export function legacyToNewId(legacyId: string): string {
  return LEGACY_ID_MAP[legacyId] ?? legacyId;
}

/**
 * Create reverse mapping for lookups
 */
export const NEW_TO_LEGACY_MAP: Record<string, string> = Object.entries(LEGACY_ID_MAP)
  .reduce((acc, [legacy, newId]) => {
    acc[newId] = legacy;
    return acc;
  }, {} as Record<string, string>);
