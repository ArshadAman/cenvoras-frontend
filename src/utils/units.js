export const DEFAULT_UNITS = [
  "pcs",
  "kg",
  "ltr",
  "box",
  "meter",
  "nos",
  "pack",
  "roll",
  "sqft",
  "set",
];

export const getStoredCustomUnits = () => {
  try {
    const raw = localStorage.getItem("cenvora_custom_units");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomUnit = (unit) => {
  if (!unit) return;
  const clean = unit.trim().toLowerCase();
  if (!clean) return;
  try {
    const current = getStoredCustomUnits();
    if (!current.includes(clean)) {
      const next = [...current, clean];
      localStorage.setItem("cenvora_custom_units", JSON.stringify(next));
    }
  } catch {
    // ignore storage errors
  }
};

export const getAllUnits = () => {
  const custom = getStoredCustomUnits();
  return Array.from(new Set([...DEFAULT_UNITS, ...custom]));
};

// UAT P1 item 5 retest: a line's unit (the product's unit, e.g. "KGS") must always be selectable,
// otherwise the <select> silently shows the first option ("pcs").
export const unitOptionsWith = (units, current) => {
  const cur = String(current || "").trim();
  if (!cur || units.includes(cur)) return units;
  return [cur, ...units];
};
