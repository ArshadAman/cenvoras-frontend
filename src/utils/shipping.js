/**
 * Shipping vs Billing address comparison and GST Bill-to-Ship-to auto-selection helpers.
 */

export function normalizeAddressText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Returns true when both billing and shipping addresses are non-empty and differ
 * after whitespace/case normalization.
 */
export function hasShippingBillingDifference(billingAddress, shippingAddress) {
  const billing = normalizeAddressText(billingAddress);
  const shipping = normalizeAddressText(shippingAddress);
  return Boolean(billing && shipping && billing !== shipping);
}

/**
 * Computes initial `bill_to_ship_to` state when opening an existing document for edit.
 * Under IGST s.10(1)(b), checking Bill-to-ship-to blocks saving if `place_of_supply`
 * differs from the bill-to customer's state (`default_pos`). Preserve that flexibility
 * when editing a saved inter-state goods override whose POS already differs.
 */
export function shouldAutoSelectBillToShipToOnInit({
  billingAddress,
  deliveryAddress,
  placeOfSupply,
  defaultPos,
}) {
  if (!hasShippingBillingDifference(billingAddress, deliveryAddress)) {
    return false;
  }
  const pos = String(placeOfSupply ?? "").trim().toUpperCase();
  const def = String(defaultPos ?? "").trim().toUpperCase();
  if (pos && def && pos !== def) {
    return false;
  }
  return true;
}
