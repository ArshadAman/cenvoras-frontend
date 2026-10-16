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

/**
 * Standard column default widths (in percentages) when enabled
 */
export const DEFAULT_COLUMN_WIDTHS = {
  serial: 5,     // 5%
  hsn: 10,       // 10%
  quantity: 8,   // 8%
  free_qty: 7,   // 7%
  unit: 6,       // 6%
  batch: 10,     // 10%
  make: 9,       // 9%
  pack_size: 8,  // 8%
  price: 12,     // 12%
  discount: 7,   // 7%
  tax: 7,        // 7%
  amount: 13,    // 13%
};

/**
 * Filter columns taking into account both `show` and `visible` properties,
 * and delivery challan exclusions.
 */
export function getVisibleColumns(columns = [], options = {}) {
  const { isDeliveryChallan = false, defaultColumns = [] } = options;
  const cols = (Array.isArray(columns) && columns.length > 0) ? columns : defaultColumns;

  return cols.filter(col => {
    if (!col || !col.id) return false;
    if (isDeliveryChallan && ['price', 'discount', 'tax', 'amount'].includes(col.id)) {
      return false;
    }
    // Check both `show` and `visible` properties (defaults to true if neither is explicitly false)
    if (col.show === false || col.visible === false) {
      return false;
    }
    return true;
  });
}

/**
 * Compute balanced column widths for an invoice table ensuring the description
 * column gets generous width (minimum 35%, typically 40-70%) and no columns collide.
 */
export function calculateColumnWidths(visibleColumns = []) {
  if (!Array.isArray(visibleColumns) || visibleColumns.length === 0) {
    return {};
  }

  const hasDesc = visibleColumns.some(c => c.id === 'description');
  const nonDescCols = visibleColumns.filter(c => c.id !== 'description');

  if (!hasDesc) {
    const equalWidth = `${(100 / visibleColumns.length).toFixed(1)}%`;
    const result = {};
    visibleColumns.forEach(c => { result[c.id] = equalWidth; });
    return result;
  }

  // Base widths for non-description columns
  let rawSum = 0;
  const colWidths = {};
  nonDescCols.forEach(col => {
    const baseW = DEFAULT_COLUMN_WIDTHS[col.id] || 8;
    colWidths[col.id] = baseW;
    rawSum += baseW;
  });

  // Guarantee description column gets at least 35% of the table width
  const maxNonDescWidth = 65; // leaves at least 35% for description
  let descWidth = 100 - rawSum;

  if (rawSum > maxNonDescWidth) {
    const scaleFactor = maxNonDescWidth / rawSum;
    nonDescCols.forEach(col => {
      colWidths[col.id] = Number((colWidths[col.id] * scaleFactor).toFixed(1));
    });
    descWidth = 35;
  }

  const result = {
    description: `${descWidth.toFixed(1)}%`,
  };
  nonDescCols.forEach(col => {
    result[col.id] = `${colWidths[col.id]}%`;
  });

  return result;
}

