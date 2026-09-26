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
  } catch (e) {
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
  } catch (e) {}
};

export const getAllUnits = () => {
  const custom = getStoredCustomUnits();
  return Array.from(new Set([...DEFAULT_UNITS, ...custom]));
};
