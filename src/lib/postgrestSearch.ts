const MAX_SEARCH_LENGTH = 200;

export function sanitizeSearchQuery(query: string): string {
  return query.trim().slice(0, MAX_SEARCH_LENGTH);
}

/** Escape ILIKE wildcards so user input is matched literally. */
function escapeIlikeTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Build a PostgREST `.or()` filter for case-insensitive search on multiple columns.
 * Values are double-quoted so commas/parens in the query cannot break the filter.
 */
export function buildIlikeOrFilter(
  columns: string[],
  query: string,
): string | null {
  const trimmed = sanitizeSearchQuery(query);
  if (trimmed.length < 2) return null;

  const pattern = `%${escapeIlikeTerm(trimmed)}%`;
  const quoted = `"${pattern.replace(/"/g, '""')}"`;

  return columns.map((column) => `${column}.ilike.${quoted}`).join(",");
}
