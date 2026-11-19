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
 * Filters a list of products by query, excluding HSN/SAC matching.
 */
export function filterProductsBySearch(products, query) {
  if (!query || !String(query).trim()) return [];
  const list = Array.isArray(products) ? products : [];
  return list.filter((p) => matchesProductSearch(p, query));
}
