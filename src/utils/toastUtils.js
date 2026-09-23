import { toast } from 'react-toastify';

/**
 * Humanizes DRF field names and technical keys into user-friendly titles.
 */
function humanizeKey(key) {
  if (!key || key === 'non_field_errors' || key === 'detail' || key === 'error') {
    return '';
  }
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

  // Handle { error: "..." }
  if (typeof responseData.error === 'string') {
    for (const { pattern, replacement } of TECHNICAL_MESSAGE_MAP) {
      if (pattern.test(responseData.error)) return replacement;
    }
    return responseData.error;
  }

  // Handle array of errors: ["Error message 1", "Error message 2"]
  if (Array.isArray(responseData)) {
    const first = responseData[0];
    if (typeof first === 'string') {
      for (const { pattern, replacement } of TECHNICAL_MESSAGE_MAP) {
        if (pattern.test(first)) return replacement;
      }
      return first;
    }
  }

  // Handle validation field objects: { email: ["Invalid email format."], phone: ["Required"] }
  if (typeof responseData === 'object') {
    const errorMessages = [];

    for (const [key, val] of Object.entries(responseData)) {
      const fieldTitle = humanizeKey(key);
      let messageText = '';

      if (Array.isArray(val)) {
        messageText = val.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
      } else if (typeof val === 'string') {
        messageText = val;
      } else if (typeof val === 'object' && val !== null) {
        messageText = Object.values(val).flat().join(', ');
      }

      // Check against technical message map
      for (const { pattern, replacement } of TECHNICAL_MESSAGE_MAP) {
        if (pattern.test(messageText)) {
          messageText = replacement;
          break;
        }
      }

      if (fieldTitle) {
        errorMessages.push(`${fieldTitle}: ${messageText}`);
      } else {
        errorMessages.push(messageText);
      }
    }

    if (errorMessages.length > 0) {
      return errorMessages.slice(0, 3).join(' • ');
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
