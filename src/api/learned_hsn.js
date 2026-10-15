import api from "./api";

/** Lookup tenant-learned GST rate for an HSN code. */
export const lookupLearnedHsnGst = (hsn) =>
  api
    .get("/billing/learned-hsn-gst/", { params: { hsn } })
    .then((res) => res.data?.data ?? res.data ?? null);

/** List recent learned HSN→GST mappings for this tenant. */
export const listLearnedHsnGst = () =>
  api.get("/billing/learned-hsn-gst/").then((res) => res.data?.data || []);
