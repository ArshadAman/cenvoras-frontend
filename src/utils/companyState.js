/**
 * Company state for PT defaults. The COMPANY (tenant billing_profile) wins over the
 * logged-in user's own profile; a GSTIN prefix (29 = Karnataka) wins over a free-text state.
 * QA: Add Employee defaulted 'Work State (PT)' to Odisha for a Karnataka (29…) company.
 */
export function stateLabelFromGstin(gstin, indianStates, getGSTStateCode) {
  const code = String(gstin || '').trim().slice(0, 2);
  if (!/^\d{2}$/.test(code)) return null;
  const hit = indianStates.find((s) => getGSTStateCode(s.value) === code || getGSTStateCode(s.label) === code);
  return hit ? hit.label : null;
}

export function stateLabelFromText(raw, indianStates, getGSTStateCode) {
  const v = String(raw || '').trim();
  if (!v) return null;
  const byLabel = indianStates.find((s) => s.label.toLowerCase() === v.toLowerCase());
  if (byLabel) return byLabel.label;
  const code = getGSTStateCode(v);
  if (code) {
    const byCode = indianStates.find((s) => getGSTStateCode(s.value) === code || getGSTStateCode(s.label) === code);
    if (byCode) return byCode.label;
  }
  return null;
}

export function resolveCompanyWorkStateFromProfile(profileData, indianStates, getGSTStateCode, fallback = 'Karnataka') {
  const company = profileData?.billing_profile || {};
  const user = profileData?.profile || {};
  return (
    stateLabelFromGstin(company.gstin, indianStates, getGSTStateCode)
    || stateLabelFromText(company.state, indianStates, getGSTStateCode)
    || stateLabelFromGstin(user.gstin, indianStates, getGSTStateCode)
    || stateLabelFromText(user.state, indianStates, getGSTStateCode)
    || fallback
  );
}
