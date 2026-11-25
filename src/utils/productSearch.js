/**
 * Matches a product against a search query.
 * Excludes HSN/SAC code ("hsnc") to prevent unrelated products sharing the same
 * tax classification code from cluttering the search results.
 *
 * Matches against:
 * - Product Name
 * - Item Code / SKU
 * - Internal Reference
 * - Manufacturer / Brand
 */
export function matchesProductSearch(product, query) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  if (!q) return true;

  const name = String(product?.name || "").toLowerCase();
  const code = String(product?.item_code || "").toLowerCase();
  const ref = String(product?.internal_reference || "").toLowerCase();
  const mfr = String(product?.manufacturer || "").toLowerCase();

  return name.includes(q) || code.includes(q) || ref.includes(q) || mfr.includes(q);
}

/**
 * Scores how relevant a product is to a search query.
 * Lower score = more relevant. Returns -1 if product does not match.
 */
export function scoreProductRelevance(product, query) {
  if (!query) return -1;
  const q = String(query).trim().toLowerCase();
  if (!q) return -1;

  const name = String(product?.name || "").toLowerCase();
  const code = String(product?.item_code || "").toLowerCase();
  const ref = String(product?.internal_reference || "").toLowerCase();
  const mfr = String(product?.manufacturer || "").toLowerCase();

  // Exact item_code match
  if (code === q) return 0;
  // item_code starts with query
  if (code.startsWith(q)) return 1;
  // name starts with query
  if (name.startsWith(q)) return 2;
  // item_code contains query
  if (code.includes(q)) return 3;
  // name contains query
  if (name.includes(q)) return 4;
  // ref or manufacturer match
  if (ref.includes(q) || mfr.includes(q)) return 5;

  return -1;
}

/**
 * Sorts a list of products by relevance to query (closest match first).
 * Tie-breaks alphabetically by item_code, then name.
 */
export function sortProductsByRelevance(products, query) {
  const list = Array.isArray(products) ? [...products] : [];
  const q = String(query || "").trim().toLowerCase();
  if (!q) return list;

  return list.sort((a, b) => {
    const sa = scoreProductRelevance(a, q);
    const sb = scoreProductRelevance(b, q);
    if (sa !== sb) return sa - sb;

    const ca = String(a?.item_code || "").toLowerCase();
    const cb = String(b?.item_code || "").toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb);

    return String(a?.name || "").toLowerCase().localeCompare(String(b?.name || "").toLowerCase());
  });
}

/**
 * Filters a list of products by query, excluding HSN/SAC matching,
 * and sorts results by relevance (closest match first).
 */
export function filterProductsBySearch(products, query) {
  if (!query || !String(query).trim()) return [];
  const list = Array.isArray(products) ? products : [];
  return sortProductsByRelevance(
    list.filter((p) => matchesProductSearch(p, query)),
    query
  );
}
