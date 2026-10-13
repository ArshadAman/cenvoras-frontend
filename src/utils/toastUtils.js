import { toast } from 'react-toastify';

/**
 * Humanizes DRF field names and technical keys into user-friendly titles.
 */
function humanizeKey(key) {
  if (!key || key === 'non_field_errors' || key === 'detail' || key === 'error') {
    return '';
  }
  if (key === 'hsn_sac_code' || key === 'hsn_code') {
    return 'HSN/SAC Code';
  }
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Soften common HSN mandatory wording for toasts.
 */
function softenFieldMessage(message) {
  if (typeof message !== 'string') return message;
  return message
    .replace(/HSN\/SAC code is mandatory for each invoice item\.?/i, 'HSN/SAC code is required.')
    .replace(/HSN\/SAC code is mandatory\.?/i, 'HSN/SAC code is required.');
}

/**
 * Recursively flatten DRF nested validation errors into readable lines.
 * e.g. items: [{}, { hsn_sac_code: ["..."] }] -> "Line 2: HSN/SAC code is required."
 */
function flattenValidationErrors(value, fieldKey = '', linePrefix = '') {
  const messages = [];

  if (value == null) return messages;

  if (typeof value === 'string') {
    const text = softenFieldMessage(value);
    const title = humanizeKey(fieldKey);
    if (linePrefix && title) messages.push(`${linePrefix}${title}: ${text}`);
    else if (linePrefix) messages.push(`${linePrefix}${text}`);
    else if (title) messages.push(`${title}: ${text}`);
    else messages.push(text);
    return messages;
  }

  if (Array.isArray(value)) {
    const allStrings = value.every((v) => typeof v === 'string');
    if (allStrings) {
      const text = softenFieldMessage(value.join(', '));
      const title = humanizeKey(fieldKey);
      if (linePrefix && title) messages.push(`${linePrefix}${title}: ${text}`);
      else if (linePrefix) messages.push(`${linePrefix}${text}`);
      else if (title) messages.push(`${title}: ${text}`);
      else messages.push(text);
      return messages;
    }

    value.forEach((entry, index) => {
      if (entry == null || entry === '') return;
      if (typeof entry === 'string') {
        messages.push(...flattenValidationErrors(entry, fieldKey, linePrefix));
        return;
      }
      if (typeof entry === 'object') {
        const isEmpty = Object.keys(entry).length === 0;
        if (isEmpty) return;
        const nextPrefix =
          fieldKey === 'items' || fieldKey === 'item'
            ? `Line ${index + 1}: `
            : linePrefix || (humanizeKey(fieldKey) ? `${humanizeKey(fieldKey)} ${index + 1}: ` : '');
        messages.push(...flattenValidationErrors(entry, '', nextPrefix));
      }
    });
    return messages;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'non_field_errors' || key === 'detail' || key === 'error') {
        messages.push(...flattenValidationErrors(nested, '', linePrefix));
      } else {
        messages.push(...flattenValidationErrors(nested, key, linePrefix));
      }
    }
  }

  return messages;
}

/**
 * Maps known raw or technical backend error messages to friendly, polite explanations.
 */
const TECHNICAL_MESSAGE_MAP = [
  {
    pattern: /A mandatory reason must be provided to reopen payroll/i,
    replacement: 'Please provide a reason for reopening this payroll cycle.',
  },
  {
    pattern: /Only (?:processed|approved|paid|locked|finalised) payroll runs can be reopened/i,
    replacement: 'This payroll cycle cannot be reopened in its current status.',
  },
  {
    pattern: /Payroll run is already in draft status/i,
    replacement: 'This payroll cycle is already in draft status.',
  },
  {
    pattern: /Cannot recalculate a locked payroll run/i,
    replacement: 'This payroll cycle is locked. Please reopen it before recalculating.',
  },
  {
    pattern: /Specified payment bank account not found/i,
    replacement: 'Please select a valid disbursement bank account.',
  },
  {
    pattern: /Only HR Admin or Admin roles are authorized/i,
    replacement: 'You do not have permission to perform this action. Please contact your administrator.',
  },
  {
    pattern: /Network Error|ERR_NETWORK|ECONNABORTED/i,
    replacement: 'Unable to connect to the server. Please check your internet connection.',
  },
  {
    pattern: /Internal Server Error|status code 500/i,
    replacement: 'A temporary server error occurred. Please try again shortly.',
  },
];

/**
 * Parses any Axios error, DRF error object, or string into a clean, end-user friendly message.
 */
export function formatErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  // Handle direct string input
  if (typeof err === 'string') {
    if (err.includes('<html') || err.includes('Traceback')) {
      return 'A server error occurred. Please try again or contact support.';
    }
    return err;
  }

  // Handle network / timeout errors
  if (err.message && /Network Error|ERR_NETWORK|timeout/i.test(err.message)) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  const responseData = err.response?.data;
  if (!responseData) {
    if (err.message && !err.message.includes('status code')) {
      return err.message;
    }
    return fallback;
  }

  // Handle HTML responses (e.g. 500 pages)
  if (typeof responseData === 'string') {
    if (responseData.includes('<html') || responseData.includes('Traceback')) {
      return 'A temporary server error occurred. Please try again shortly.';
    }
    return responseData;
  }

  // Handle DRF { detail: "..." }
  if (typeof responseData.detail === 'string') {
    for (const { pattern, replacement } of TECHNICAL_MESSAGE_MAP) {
      if (pattern.test(responseData.detail)) return replacement;
    }
    return responseData.detail;
  }

  // Handle { error: "Validation failed", details: { field: ["msg"] } }
  if (
    typeof responseData.error === 'string' &&
    responseData.details &&
    typeof responseData.details === 'object' &&
    !Array.isArray(responseData.details)
  ) {
    const detailMessages = flattenValidationErrors(responseData.details);
    if (detailMessages.length > 0) {
      return detailMessages.slice(0, 3).join(' • ');
    }
  }

  // Handle { error: "..." }
  if (typeof responseData.error === 'string' && !responseData.details) {
    for (const { pattern, replacement } of TECHNICAL_MESSAGE_MAP) {
      if (pattern.test(responseData.error)) return replacement;
    }
    return responseData.error;
  }

  // Handle array of errors / nested DRF field objects
  if (typeof responseData === 'object') {
    const errorMessages = flattenValidationErrors(responseData);
    if (errorMessages.length > 0) {
      return errorMessages
        .slice(0, 3)
        .map((msg) => {
          for (const { pattern, replacement } of TECHNICAL_MESSAGE_MAP) {
            if (pattern.test(msg)) return replacement;
          }
          return msg;
        })
        .join(' • ');
    }
  }

  return fallback;
}

/**
 * Displays a clean, end-user friendly error notification.
 */
export function showErrorToast(err, fallback = 'An error occurred. Please try again.') {
  const msg = formatErrorMessage(err, fallback);
  toast.error(msg);
  return msg;
}

/**
 * Displays a clean, user-friendly success notification.
 */
export function showSuccessToast(message) {
  toast.success(message);
}
