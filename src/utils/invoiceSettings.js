// Invoice Template Settings Utility
// Manages invoice customization with localStorage (backend API ready for future)

// Default invoice template settings
export const defaultInvoiceTemplate = {
  id: 'default',
  name: 'Classic Professional',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  
  // Branding - will use user's business info
  branding: {
    useBusinessName: true, // Use from user profile
    customName: '',
    logo: null, // Base64 or URL
    showLogo: false,
    logoPosition: { x: 20, y: 20 }, // Draggable position
    logoSize: { width: 120, height: 60 },
    tagline: '',
  },
  
  // Colors
  colors: {
    primary: '#1a1a2e',       // Header/company name
    secondary: '#16213e',     // Subheadings
    accent: '#0f3460',        // Highlights/borders
    text: '#333333',          // Body text
    lightText: '#666666',     // Secondary text
    background: '#ffffff',    // Paper background
    tableBorder: '#e5e7eb',   // Table borders
    tableHeader: '#f8fafc',   // Table header bg
    tableStripe: '#fafafa',   // Alternate row
    totalRow: '#1a1a2e',      // Total row bg
    totalText: '#ffffff',     // Total row text
  },
  
  // Typography
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headerFont: 'Inter, system-ui, sans-serif',
    companyNameSize: 24,
    invoiceTitleSize: 18,
    sectionTitleSize: 12,
    bodySize: 11,
    smallSize: 9,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  
  // Layout - Draggable elements with positions
  layout: {
    paperSize: 'A4',
    orientation: 'portrait',
    layoutType: 'classic',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    
    // Element positions (for Canva-like editing)
    elements: {
      companyInfo: { x: 0, y: 0, align: 'left', width: '50%' },
      customerInfo: { x: 50, y: 0, align: 'right', width: '50%' },
      invoiceTitle: { x: 0, y: 120, align: 'center', width: '100%' },
      invoiceDetails: { x: 0, y: 160, align: 'left', width: '100%' },
      itemsTable: { x: 0, y: 220, width: '100%' },
      bankDetails: { x: 0, y: 'auto', align: 'left', width: '45%' },
      totals: { x: 55, y: 'auto', align: 'right', width: '45%' },
      terms: { x: 0, y: 'auto', width: '100%' },
      signature: { x: 70, y: 'auto', align: 'right', width: '30%' },
      footer: { x: 0, y: 'auto', align: 'center', width: '100%' },
    },
  },
  
  // Section Visibility
  sections: {
    showLogo: false,
    showTagline: false,
    showGST: true,
    showGEMID: false,
    showHSN: true,
    showBankDetails: true,
    showTerms: true,
    showSignature: true,
    showQRCode: false,
    showAmountInWords: true,
    showPONumber: true,
    showDueDate: true,
    showDeliveryAddress: false,
  },
  
  // Custom Content
  content: {
    invoiceTitle: 'TAX INVOICE',
    invoiceSubtitle: '',
    termsAndConditions: [
      'Payment is due within 30 days of invoice date.',
      'Please include invoice number with payment.',
    ],
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolder: '',
    },
    footerNote: 'Thank you for your business!',
    signatureLabel: 'Authorized Signatory',
  },
  
  // Table Column Configuration
  columns: [
    { id: 'serial', label: 'S. No', width: '6%', show: true, align: 'center' },
    { id: 'description', label: 'Description', width: '25%', show: true, align: 'left' },
    { id: 'batch', label: 'Batch', width: '10%', show: false, align: 'center' },
    { id: 'hsn', label: 'HSNC', width: '12%', show: true, align: 'center' },
    { id: 'quantity', label: 'QTY', width: '7%', show: true, align: 'center' },
    { id: 'free_qty', label: 'Free', width: '7%', show: false, align: 'center' },
    { id: 'unit', label: 'Unit', width: '8%', show: false, align: 'center' },
    { id: 'make', label: 'Make', width: '10%', show: false, align: 'left' },
    { id: 'pack_size', label: 'Pack Size', width: '10%', show: false, align: 'left' },
    { id: 'price', label: 'UNIT PRICE', width: '14%', show: true, align: 'right' },
    { id: 'discount', label: 'Disc.', width: '9%', show: false, align: 'right' },
    { id: 'tax', label: 'TAX', width: '9%', show: true, align: 'center' },
    { id: 'amount', label: 'AMOUNT', width: '18%', show: true, align: 'right' },
  ],
  
  // Styles
  styles: {
    borderRadius: 0,
    borderWidth: 1,
    shadowEnabled: false,
    headerStyle: 'solid', // solid, gradient, minimal
    tableStyle: 'bordered', // bordered, minimal, striped
  },
};

// Template presets
export const templatePresets = [
  {
    ...defaultInvoiceTemplate,
    id: 'classic',
    name: 'Classic Professional',
    layout: { ...defaultInvoiceTemplate.layout, layoutType: 'classic' },
  },
  {
    ...defaultInvoiceTemplate,
    id: 'professional',
    name: 'Professional (Marico Style)',
    layout: { ...defaultInvoiceTemplate.layout, layoutType: 'professional' },
    colors: {
      ...defaultInvoiceTemplate.colors,
      primary: '#0a235c',
    },
  },
  {
    ...defaultInvoiceTemplate,
    id: 'service',
    name: 'Service Template (LTIMindtree)',
    layout: { ...defaultInvoiceTemplate.layout, layoutType: 'service' },
    colors: {
      ...defaultInvoiceTemplate.colors,
      primary: '#174A82',
    },
  },
  {
    ...defaultInvoiceTemplate,
    id: 'legend',
    name: 'Legend Corporate (ITC Style)',
    layout: { ...defaultInvoiceTemplate.layout, layoutType: 'legend' },
    colors: {
      ...defaultInvoiceTemplate.colors,
      primary: '#111827',
      accent: '#2563eb',
    },
  },
  {
    ...defaultInvoiceTemplate,
    id: 'billship',
    name: 'Bill To - Ship To (Flipkart Style)',
    layout: { ...defaultInvoiceTemplate.layout, layoutType: 'billship' },
    colors: {
      ...defaultInvoiceTemplate.colors,
      primary: '#facc15',
    },
  },
];

/** Presets removed from the product; strip from localStorage on load. */
const DEPRECATED_TEMPLATE_IDS = new Set(['modern', 'genz']);

// Storage keys — templates are isolated per document section
const LEGACY_STORAGE_KEY = 'cenvora_invoice_templates';

export const documentTypeToSectionKey = (documentType) => {
  switch (documentType) {
    case 'quotation':
      return 'quotation';
    case 'delivery_challan':
      return 'delivery_challan';
    case 'sales_order':
      return 'sales_order';
    case 'invoice':
    case 'sales_invoice':
    default:
      return 'sales_invoice';
  }
};

const sectionTemplatesKey = (sectionKey) => `cenvora_invoice_templates_${sectionKey || 'sales_invoice'}`;

const deepClonePresets = () => JSON.parse(JSON.stringify(templatePresets));

const pruneDeprecatedTemplates = (parsed) => {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((t) => t && !DEPRECATED_TEMPLATE_IDS.has(t.id));
};

const mergeMissingPresets = (parsed) => {
  const pruned = pruneDeprecatedTemplates(parsed);
  const existingIds = new Set(pruned.map((t) => t.id));
  const missingPresets = templatePresets
    .filter((p) => !existingIds.has(p.id))
    .map((p) => JSON.parse(JSON.stringify(p)));
  if (missingPresets.length === 0) return pruned;
  return [...pruned, ...missingPresets];
};

/**
 * Load templates for a single section. Never shares writes across sections.
 * On first access: clone from legacy shared pool (if any), else deep-clone presets.
 */
export const getInvoiceTemplates = (sectionKey = 'sales_invoice') => {
  try {
    const key = sectionTemplatesKey(sectionKey);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = mergeMissingPresets(JSON.parse(stored));
      if (parsed.length !== JSON.parse(stored).length) {
        localStorage.setItem(key, JSON.stringify(parsed));
      }
      return parsed;
    }

    // One-time seed from legacy shared pool so existing customizations aren't lost
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const cloned = mergeMissingPresets(JSON.parse(JSON.stringify(JSON.parse(legacy))));
      localStorage.setItem(key, JSON.stringify(cloned));
      return cloned;
    }

    const presets = deepClonePresets();
    localStorage.setItem(key, JSON.stringify(presets));
    return presets;
  } catch (error) {
    console.error('Error loading invoice templates:', error);
    return deepClonePresets();
  }
};

/** @deprecated Prefer getActiveTemplateForSection — kept for callers without a section */
export const getActiveTemplate = (sectionKey = 'sales_invoice') => {
  return getActiveTemplateForSection({ sectionKey });
};

// Scoped template resolution per section (no cross-section / global fallback)
export const getActiveTemplateForSection = ({
  sectionKey = 'sales_invoice',
  documentTemplateId = null,
  customerTemplates = null,
  userDefaultTemplates = null,
} = {}) => {
  try {
    const templates = getInvoiceTemplates(sectionKey);

    // 1. Per-document explicit override
    if (documentTemplateId) {
      const match = templates.find((t) => t.id === documentTemplateId);
      if (match) return match;
    }

    // 2. Customer's preferred template for this section
    if (customerTemplates && customerTemplates[sectionKey]) {
      const match = templates.find((t) => t.id === customerTemplates[sectionKey]);
      if (match) return match;
    }

    // 3. User's section default
    if (userDefaultTemplates && userDefaultTemplates[sectionKey]) {
      const match = templates.find((t) => t.id === userDefaultTemplates[sectionKey]);
      if (match) return match;
    }

    // 4. Scoped localStorage active for this section only
    const scopedKey = `cenvora_active_template_${sectionKey}`;
    const scopedId = localStorage.getItem(scopedKey);
    if (scopedId) {
      const match = templates.find((t) => t.id === scopedId);
      if (match) return match;
    }

    return templates[0] || defaultInvoiceTemplate;
  } catch (error) {
    console.error('Error loading active template for section:', error);
    return defaultInvoiceTemplate;
  }
};

// Set active template scoped to section
export const setActiveTemplateForSection = (sectionKey, templateId) => {
  try {
    if (!sectionKey) return false;
    const scopedKey = `cenvora_active_template_${sectionKey}`;
    localStorage.setItem(scopedKey, templateId);
    return true;
  } catch (error) {
    console.error('Error setting active template for section:', error);
    return false;
  }
};

/** @deprecated Use setActiveTemplateForSection — writes sales_invoice section only */
export const setActiveTemplate = (templateId, sectionKey = 'sales_invoice') => {
  return setActiveTemplateForSection(sectionKey, templateId);
};

// Save template within a section store only
export const saveInvoiceTemplate = (template, sectionKey = 'sales_invoice') => {
  try {
    const templates = getInvoiceTemplates(sectionKey);
    const existingIndex = templates.findIndex((t) => t.id === template.id);

    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      templates[existingIndex] = updatedTemplate;
    } else {
      updatedTemplate.createdAt = new Date().toISOString();
      templates.push(updatedTemplate);
    }

    localStorage.setItem(sectionTemplatesKey(sectionKey), JSON.stringify(templates));
    return updatedTemplate;
  } catch (error) {
    console.error('Error saving invoice template:', error);
    return null;
  }
};

// Delete template within a section
export const deleteInvoiceTemplate = (templateId, sectionKey = 'sales_invoice') => {
  try {
    const templates = getInvoiceTemplates(sectionKey);
    const filtered = templates.filter((t) => t.id !== templateId);
    localStorage.setItem(sectionTemplatesKey(sectionKey), JSON.stringify(filtered));

    const scopedKey = `cenvora_active_template_${sectionKey}`;
    const activeId = localStorage.getItem(scopedKey);
    if (activeId === templateId && filtered.length > 0) {
      setActiveTemplateForSection(sectionKey, filtered[0].id);
    }

    return true;
  } catch (error) {
    console.error('Error deleting invoice template:', error);
    return false;
  }
};

// Create new template from preset (section-scoped)
export const createTemplateFromPreset = (presetId, name, sectionKey = 'sales_invoice') => {
  const preset = templatePresets.find((p) => p.id === presetId) || defaultInvoiceTemplate;
  const newTemplate = {
    ...JSON.parse(JSON.stringify(preset)),
    id: `custom_${Date.now()}`,
    name: name || `Custom Template ${Date.now()}`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveInvoiceTemplate(newTemplate, sectionKey);
};

// Duplicate template within a section
export const duplicateTemplate = (templateId, sectionKey = 'sales_invoice') => {
  const templates = getInvoiceTemplates(sectionKey);
  const source = templates.find((t) => t.id === templateId);

  if (!source) return null;

  const duplicate = {
    ...JSON.parse(JSON.stringify(source)),
    id: `custom_${Date.now()}`,
    name: `${source.name} (Copy)`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveInvoiceTemplate(duplicate, sectionKey);
};

// Reset one section to default presets
export const resetToDefaults = (sectionKey = 'sales_invoice') => {
  try {
    localStorage.setItem(sectionTemplatesKey(sectionKey), JSON.stringify(deepClonePresets()));
    setActiveTemplateForSection(sectionKey, 'classic');
    return true;
  } catch (error) {
    console.error('Error resetting templates:', error);
    return false;
  }
};

// Number to words converter for Indian currency
export const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);
  
  let words = '';
  
  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  if (Math.floor(num / 100) > 0) {
    words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }
  
  if (num > 0) {
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += ' ' + ones[num % 10];
      }
    }
  }
  
  return words.trim();
};

export const amountInWords = (amount) => {
  if (amount == null || isNaN(amount)) return 'Zero Rupees Only';

  // Round to 2 decimal places to eliminate IEEE-754 floating-point artifacts (e.g. 251999.99999999997)
  const cleanAmount = Math.round((Number(amount) || 0) * 100) / 100;
  if (cleanAmount === 0) return 'Zero Rupees Only';

  const isNegative = cleanAmount < 0;
  const absAmount = Math.abs(cleanAmount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let result = '';
  if (isNegative) result += 'Minus ';

  if (rupees > 0) {
    result += numberToWords(rupees) + (rupees === 1 ? ' Rupee' : ' Rupees');
  }

  if (paise > 0) {
    const paiseUnit = paise === 1 ? ' Paisa' : ' Paise';
    if (rupees > 0) {
      result += ' and ' + numberToWords(paise) + paiseUnit;
    } else {
      result += numberToWords(paise) + paiseUnit;
    }
  }

  result += ' Only';
  return result.trim();
};

export default {
  defaultInvoiceTemplate,
  templatePresets,
  documentTypeToSectionKey,
  getInvoiceTemplates,
  getActiveTemplate,
  getActiveTemplateForSection,
  setActiveTemplate,
  setActiveTemplateForSection,
  saveInvoiceTemplate,
  deleteInvoiceTemplate,
  createTemplateFromPreset,
  duplicateTemplate,
  resetToDefaults,
  numberToWords,
  amountInWords,
};
