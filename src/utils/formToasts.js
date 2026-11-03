// R22: error toasts from a failed save stay until the user closes them, and a successful save
// dismisses every earlier error toast raised by that form (stale toasts were covering buttons).
import { toast } from 'react-toastify';

const active = {};

export const formError = (form, message, opts = {}) => {
  const { type = 'error', key = 'save', ...rest } = opts || {};
  const id = `${form}-${key}-${type}`;
  (active[form] ||= new Set()).add(id);
  const options = { ...rest, toastId: id, autoClose: false, closeOnClick: false, draggable: false };
  if (toast.isActive(id)) {
    toast.update(id, { ...options, render: message, type });
  } else {
    (toast[type] || toast.error)(message, options);
  }
  return id;
};

export const clearFormErrors = (form) => {
  (active[form] || []).forEach((id) => toast.dismiss(id));
  active[form] = new Set();
};
