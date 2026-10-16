/**
 * invoicePaginator.js
 * 
 * Deterministic pagination utility for A4 invoice templates.
 * Chunks invoice items across multiple A4 pages (210mm x 297mm) so that:
 * 1. The template Header appears at the top of every page.
 * 2. Item rows never get sliced mid-page.
 * 3. The Footer sits sticky at the bottom of the final page.
 * 4. Intermediate pages render a clean continuation marker.
 * 5. Multi-page bills are proportionally balanced with no awkward 1-item orphan pages.
 */

export function getItemWeight(item) {
  if (!item) return 1;
  if (item.row_type === 'note') return 1;

  let weight = 1;
  const desc = item.description || item.product_description || item.product_detail?.description || '';
  if (desc && desc.length > 30) {
    weight += 0.4;
  }
  if (item.batch_number || item.batch?.batch_number || item.batch || item.expiry_date) {
    weight += 0.3;
  }
  return weight;
}

export function paginateInvoiceItems(items = [], options = {}) {
  const isDeliveryChallan = Boolean(options.isDeliveryChallan);

  // Maximum items/weight per page
  const maxWithFooter = isDeliveryChallan ? 14 : 8;
  const maxWithoutFooter = isDeliveryChallan ? 18 : 15;

  if (!Array.isArray(items) || items.length === 0) {
    return [[]];
  }

  // Check if everything comfortably fits on a single page with the full footer
  const totalWeight = items.reduce((sum, it) => sum + getItemWeight(it), 0);
  if (items.length <= maxWithFooter && totalWeight <= (isDeliveryChallan ? 15 : 9.5)) {
    return [items];
  }

  // If items fit in exactly 2 pages (maxWithoutFooter + maxWithFooter):
  if (items.length <= maxWithoutFooter + maxWithFooter) {
    const page2Count = Math.min(
      maxWithFooter,
      Math.max(3, Math.ceil(items.length * (maxWithFooter / (maxWithoutFooter + maxWithFooter))))
    );
    const page1Count = items.length - page2Count;
    return [items.slice(0, page1Count), items.slice(page1Count)];
  }

  // For 3+ pages:
  const pages = [];
  let remaining = [...items];

  while (remaining.length > 0) {
    if (remaining.length <= maxWithFooter) {
      pages.push(remaining);
      break;
    }

    if (remaining.length <= maxWithoutFooter + maxWithFooter) {
      const page2Count = Math.min(
        maxWithFooter,
        Math.max(3, Math.ceil(remaining.length * (maxWithFooter / (maxWithoutFooter + maxWithFooter))))
      );
      const page1Count = remaining.length - page2Count;
      pages.push(remaining.slice(0, page1Count));
      pages.push(remaining.slice(page1Count));
      break;
    }

    pages.push(remaining.slice(0, maxWithoutFooter));
    remaining = remaining.slice(maxWithoutFooter);
  }

  return pages.length > 0 ? pages : [[]];
}
