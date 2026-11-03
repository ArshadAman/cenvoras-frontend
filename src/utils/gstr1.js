// Strip Cenvora-only metadata (keys starting with '_') before the JSON goes to the GSTN tool.
export const portalGSTR1 = (data) =>
  Object.fromEntries(Object.entries(data || {}).filter(([k]) => !k.startsWith('_')));
