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
    id: 'genz',
    name: 'GenZ Modern (Google Style)',
    layout: { ...defaultInvoiceTemplate.layout, layoutType: 'genz' },
    colors: {
      ...defaultInvoiceTemplate.colors,
      primary: '#4285F4',
      secondary: '#4285F4',
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
  {
    ...defaultInvoiceTemplate,
    id: 'modern',
    name: 'Modern Minimal',
    layout: { ...defaultInvoiceTemplate.layout, layoutType: 'classic' },
    colors: {
      ...defaultInvoiceTemplate.colors,
      primary: '#000000',
      secondary: '#333333',
      accent: '#6366f1',
      tableHeader: '#f1f5f9',
      totalRow: '#6366f1',
    },
    styles: {
      ...defaultInvoiceTemplate.styles,
      borderRadius: 8,
      headerStyle: 'minimal',
      tableStyle: 'minimal',
    },
  },
];

// Storage keys
const STORAGE_KEY = 'cenvora_invoice_templates';
const ACTIVE_TEMPLATE_KEY = 'cenvora_active_template';

// Get all saved templates
export const getInvoiceTemplates = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Return default presets if nothing stored
    return templatePresets;
  } catch (error) {
    console.error('Error loading invoice templates:', error);
    return templatePresets;
  }
};

// Get active template
export const getActiveTemplate = () => {
  try {
    const activeId = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
    const templates = getInvoiceTemplates();
    
    if (activeId) {
      const template = templates.find(t => t.id === activeId);
      if (template) return template;
    }
    
    // Return first template or default
    return templates[0] || defaultInvoiceTemplate;
  } catch (error) {
    console.error('Error loading active template:', error);
    return defaultInvoiceTemplate;
  }
};

// Set active template
export const setActiveTemplate = (templateId) => {
  try {
    localStorage.setItem(ACTIVE_TEMPLATE_KEY, templateId);
    return true;
  } catch (error) {
    console.error('Error setting active template:', error);
    return false;
  }
};

// Save template
export const saveInvoiceTemplate = (template) => {
  try {
    const templates = getInvoiceTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return updatedTemplate;
  } catch (error) {
    console.error('Error saving invoice template:', error);
    return null;
  }
};

// Delete template
export const deleteInvoiceTemplate = (templateId) => {
  try {
    const templates = getInvoiceTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // If deleted was active, set first as active
    const activeId = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
    if (activeId === templateId && filtered.length > 0) {
      setActiveTemplate(filtered[0].id);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting invoice template:', error);
    return false;
  }
};

// Create new template from preset
export const createTemplateFromPreset = (presetId, name) => {
  const preset = templatePresets.find(p => p.id === presetId) || defaultInvoiceTemplate;
  const newTemplate = {
    ...preset,
    id: `custom_${Date.now()}`,
    name: name || `Custom Template ${Date.now()}`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveInvoiceTemplate(newTemplate);
};

// Duplicate template
export const duplicateTemplate = (templateId) => {
  const templates = getInvoiceTemplates();
  const source = templates.find(t => t.id === templateId);
  
  if (!source) return null;
  
  const duplicate = {
    ...source,
    id: `custom_${Date.now()}`,
    name: `${source.name} (Copy)`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return saveInvoiceTemplate(duplicate);
};

// Reset to defaults
export const resetToDefaults = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templatePresets));
    setActiveTemplate('classic');
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
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = numberToWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + numberToWords(paise) + ' Paise';
  }
  result += ' Only';
  
  return result;
};

export default {
  defaultInvoiceTemplate,
  templatePresets,
  getInvoiceTemplates,
  getActiveTemplate,
  setActiveTemplate,
  saveInvoiceTemplate,
  deleteInvoiceTemplate,
  createTemplateFromPreset,
  duplicateTemplate,
  resetToDefaults,
  numberToWords,
  amountInWords,
};
