/** Canonical GST quick-select slabs (India, post 12%/28% removal). */
export const GST_RATES = [
  { value: 0, label: "0% (Exempt / Nil)" },
  { value: 3, label: "3% (Gold / Precious Metals)" },
  { value: 5, label: "5% (Essential Goods)" },
  { value: 18, label: "18% (Standard Rate)" },
  { value: 40, label: "40% (Sin / Cess Goods)" },
];

export const GST_RATE_VALUES = GST_RATES.map((r) => r.value);

/** Guide / marketing slab cards (same set as dropdowns). */
export const GST_SLAB_CARDS = [
  {
    rate: "0%",
    title: "Nil Rated / Exempt",
    description: "Fresh vegetables, grains, milk, salt, and basic healthcare.",
  },
  {
    rate: "3%",
    title: "Gold / Precious Metals",
    description: "Gold, jewellery, and other precious metal goods at the concessional slab.",
  },
  {
    rate: "5%",
    title: "Essentials",
    description: "Packaged foods, basic footwear, tea, spices, and medicines.",
  },
  {
    rate: "18%",
    title: "Standard Goods",
    description: "Electronics, computers, IT services, capital goods, and restaurants.",
  },
  {
    rate: "40%",
    title: "Sin / Luxury Goods",
    description: "Sin goods, luxury items, and categories moved from the former 28% slab.",
  },
];

/**
 * Dropdown options including a legacy entry when an existing rate is outside the canonical list.
 */
export function gstRatesWithLegacy(currentTax) {
  const rates = [...GST_RATES];
  const taxNum = currentTax != null && currentTax !== "" ? Number(currentTax) : null;
  if (taxNum !== null && Number.isFinite(taxNum) && !rates.some((r) => r.value === taxNum)) {
    rates.push({ value: taxNum, label: `${taxNum}% (Legacy Rate)` });
  }
  return rates;
}
