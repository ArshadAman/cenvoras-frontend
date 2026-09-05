import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import {
  XMarkIcon,
  PaintBrushIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  Cog6ToothIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  SwatchIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import InvoicePreview from '../invoice/InvoicePreview';
import {
  getInvoiceTemplates,
  getActiveTemplate,
  setActiveTemplate,
  saveInvoiceTemplate,
  deleteInvoiceTemplate,
  createTemplateFromPreset,
  duplicateTemplate,
  templatePresets,
  defaultInvoiceTemplate,
} from '../../utils/invoiceSettings';

// Color Picker Component
const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-gray-300">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-white/20"
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white font-mono"
        placeholder="#000000"
      />
    </div>
  </div>
);

// Toggle Switch Component
const ToggleSwitch = ({ label, checked, onChange, description }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <span className="text-sm text-white">{label}</span>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-cyan-500' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

// Number Input Component
const NumberInput = ({ label, value, onChange, min = 0, max = 100, unit = '' }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-gray-300">{label}</span>
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white text-center"
      />
      {unit && <span className="text-xs text-gray-500">{unit}</span>}
    </div>
  </div>
);

// Text Input Component
const TextInput = ({ label, value, onChange, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="text-sm text-gray-300">{label}</label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500"
    />
  </div>
);

// Textarea Component
const TextArea = ({ label, value, onChange, rows = 3, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="text-sm text-gray-300">{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 resize-none"
    />
  </div>
);

// Select Component
const Select = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-gray-300">{label}</span>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-gray-900">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Section Header
const SectionHeader = ({ children }) => (
  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-6 first:mt-0">
    {children}
  </h4>
);

// Main Component
export default function InvoiceTemplateDesigner({ isOpen, onClose, businessInfo = {} }) {
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(defaultInvoiceTemplate);
  const [activeTab, setActiveTab] = useState('layout');
  const [previewScale, setPreviewScale] = useState(0.6);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [viewMode, setViewMode] = useState('design'); // 'design' or 'preview'
  const previewRef = useRef(null);

  // Sample invoice data for preview
  const sampleInvoice = {
    invoice_number: 'INV-2024-001',
    invoice_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    po_number: 'PO-12345',
    customer_name: 'Acme Corporation',
    customer_address: '123 Business Park, Tech City\nKarnataka, India - 560001',
    customer_gstin: '29AAKCG6382L1ZU',
    items: [
      { product: 'Premium Widget Pro', hsn_sac_code: '8471', quantity: 5, price: 2500, tax: 18, unit: 'pcs' },
      { product: 'Enterprise License', hsn_sac_code: '9973', quantity: 1, price: 15000, tax: 18, unit: 'nos' },
      { product: 'Support Package', hsn_sac_code: '9983', quantity: 12, price: 500, tax: 18, unit: 'months' },
    ],
  };

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      const loadedTemplates = getInvoiceTemplates();
      setTemplates(loadedTemplates);
      
      const active = getActiveTemplate();
      setActiveTemplateId(active.id);
      setCurrentTemplate(active);
      setHasChanges(false);
    }
  }, [isOpen]);

  // Update template field
  const updateTemplate = (path, value) => {
    setCurrentTemplate(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let obj = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  // Save current template
  const handleSave = () => {
    const saved = saveInvoiceTemplate(currentTemplate);
    if (saved) {
      setTemplates(getInvoiceTemplates());
      setHasChanges(false);
      toast.success('Template saved successfully!');
    } else {
      toast.error('Failed to save template');
    }
  };

  // Set as active template
  const handleSetActive = () => {
    setActiveTemplate(currentTemplate.id);
    setActiveTemplateId(currentTemplate.id);
    toast.success('Template set as default!');
  };

  // Create new template
  const handleCreateNew = () => {
    const newName = prompt('Enter template name:', 'My Custom Template');
    if (newName) {
      const newTemplate = createTemplateFromPreset('classic', newName);
      if (newTemplate) {
        setTemplates(getInvoiceTemplates());
        setCurrentTemplate(newTemplate);
        setActiveTemplateId(newTemplate.id);
        setActiveTemplate(newTemplate.id);
        toast.success('New template created!');
      }
    }
  };

  // Duplicate template
  const handleDuplicate = () => {
    const duplicated = duplicateTemplate(currentTemplate.id);
    if (duplicated) {
      setTemplates(getInvoiceTemplates());
      setCurrentTemplate(duplicated);
      toast.success('Template duplicated!');
    }
  };

  // Delete template
  const handleDelete = () => {
    if (templates.length <= 1) {
      toast.error('Cannot delete the last template');
      return;
    }
    
    if (confirm('Are you sure you want to delete this template?')) {
      deleteInvoiceTemplate(currentTemplate.id);
      const remaining = getInvoiceTemplates();
      setTemplates(remaining);
      setCurrentTemplate(remaining[0] || defaultInvoiceTemplate);
      toast.success('Template deleted!');
    }
  };

  // Switch template
  const handleSwitchTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplate(template);
      setShowTemplateList(false);
      setHasChanges(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast.error('Logo must be less than 500KB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        updateTemplate('branding.logo', e.target.result);
        updateTemplate('sections.showLogo', true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Column toggle
  const toggleColumn = (columnId) => {
    const updatedColumns = currentTemplate.columns.map(col => 
      col.id === columnId ? { ...col, show: !col.show } : col
    );
    updateTemplate('columns', updatedColumns);
  };

  // Tabs configuration
  const tabs = [
    { id: 'layout', label: 'Layout', icon: Squares2X2Icon },
    { id: 'branding', label: 'Branding', icon: PhotoIcon },
    { id: 'colors', label: 'Colors', icon: SwatchIcon },
    { id: 'typography', label: 'Typography', icon: DocumentTextIcon },
    { id: 'sections', label: 'Sections', icon: Squares2X2Icon },
    { id: 'content', label: 'Content', icon: Cog6ToothIcon },
    { id: 'columns', label: 'Columns', icon: Squares2X2Icon },
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col lg:flex-row bg-[#0a0a0a]">
      {/* Mobile View Switcher */}
      <div className="lg:hidden flex border-b border-white/10 bg-[#111]">
        <button 
          onClick={() => setViewMode('design')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'design' ? 'text-cyan-400 bg-cyan-400/5 border-b-2 border-cyan-400' : 'text-gray-500'}`}
        >
          Design
        </button>
        <button 
          onClick={() => setViewMode('preview')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'text-cyan-400 bg-cyan-400/5 border-b-2 border-cyan-400' : 'text-gray-500'}`}
        >
          Preview
        </button>
      </div>

      {/* Left Panel - Settings */}
      <div className={`w-full lg:w-96 bg-[#111] border-r border-white/10 flex flex-col h-full ${viewMode === 'design' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Invoice Designer</h2>
            <p className="text-xs text-gray-500">Customize your invoice template</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase">Template</span>
            <button
              onClick={handleCreateNew}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <PlusIcon className="w-3 h-3" /> New
            </button>
          </div>
          
          <button
            onClick={() => setShowTemplateList(!showTemplateList)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-left flex items-center justify-between hover:bg-white/10 transition-colors"
          >
            <span className="text-white font-medium truncate">{currentTemplate.name}</span>
            {activeTemplateId === currentTemplate.id && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">Active</span>
            )}
          </button>
          
          {/* Template Dropdown */}
          {showTemplateList && (
            <div className="absolute z-10 mt-1 w-80 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleSwitchTemplate(template.id)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/10 transition-colors ${
                    currentTemplate.id === template.id ? 'bg-white/5' : ''
                  }`}
                >
                  <span className="text-white">{template.name}</span>
                  {activeTemplateId === template.id && (
                    <CheckIcon className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Template Actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleDuplicate}
              className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-1"
            >
              <DocumentDuplicateIcon className="w-3 h-3" /> Duplicate
            </button>
            <button
              onClick={handleDelete}
              className="px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-3 py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <SectionHeader>Invoice Structure</SectionHeader>
              <Select
                label="Visual Layout"
                value={currentTemplate.layout?.layoutType || 'classic'}
                onChange={(v) => updateTemplate('layout.layoutType', v)}
                options={[
                  { value: 'classic', label: 'Classic Professional' },
                  { value: 'professional', label: 'Professional (Clean)' },
                  { value: 'genz', label: 'GenZ Modern (Bold)' },
                  { value: 'service', label: 'Service Template' },
                  { value: 'legend', label: 'Legend Corporate' },
                  { value: 'billship', label: 'Bill To - Ship To' },
                ]}
              />
              <p className="text-xs text-gray-500 mt-2">
                This changes the overall structural arrangement of your invoice. Specific options like colors and custom fields will adapt to the chosen layout.
              </p>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <SectionHeader>Company Branding</SectionHeader>
              
              <ToggleSwitch
                label="Use Business Name"
                description="From your profile settings"
                checked={currentTemplate.branding?.useBusinessName !== false}
                onChange={(v) => updateTemplate('branding.useBusinessName', v)}
              />
              
              {!currentTemplate.branding?.useBusinessName && (
                <TextInput
                  label="Custom Company Name"
                  value={currentTemplate.branding?.customName}
                  onChange={(v) => updateTemplate('branding.customName', v)}
                  placeholder="Your Company Name"
                />
              )}
              
              <TextInput
                label="Tagline"
                value={currentTemplate.branding?.tagline}
                onChange={(v) => updateTemplate('branding.tagline', v)}
                placeholder="Quality you can trust"
              />
              
              <SectionHeader>Logo</SectionHeader>
              
              <ToggleSwitch
                label="Show Logo"
                checked={currentTemplate.sections?.showLogo}
                onChange={(v) => updateTemplate('sections.showLogo', v)}
              />
              
              {currentTemplate.sections?.showLogo && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Upload Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:cursor-pointer hover:file:bg-white/20"
                    />
                    <p className="text-xs text-gray-500">Max 500KB, JPG/PNG</p>
                  </div>
                  
                  {currentTemplate.branding?.logo && (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <img 
                        src={currentTemplate.branding.logo} 
                        alt="Logo Preview" 
                        className="max-h-16 mx-auto"
                      />
                      <button
                        onClick={() => updateTemplate('branding.logo', null)}
                        className="w-full mt-2 text-xs text-red-400 hover:text-red-300"
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}
                  
                  <NumberInput
                    label="Logo Width"
                    value={currentTemplate.branding?.logoSize?.width}
                    onChange={(v) => updateTemplate('branding.logoSize.width', v)}
                    min={50}
                    max={200}
                    unit="px"
                  />
                </>
              )}
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-3">
              <SectionHeader>Brand Colors</SectionHeader>
              <ColorPicker
                label="Primary (Header)"
                value={currentTemplate.colors?.primary}
                onChange={(v) => updateTemplate('colors.primary', v)}
              />
              <ColorPicker
                label="Secondary"
                value={currentTemplate.colors?.secondary}
                onChange={(v) => updateTemplate('colors.secondary', v)}
              />
              <ColorPicker
                label="Accent"
                value={currentTemplate.colors?.accent}
                onChange={(v) => updateTemplate('colors.accent', v)}
              />
              
              <SectionHeader>Text Colors</SectionHeader>
              <ColorPicker
                label="Body Text"
                value={currentTemplate.colors?.text}
                onChange={(v) => updateTemplate('colors.text', v)}
              />
              <ColorPicker
                label="Light Text"
                value={currentTemplate.colors?.lightText}
                onChange={(v) => updateTemplate('colors.lightText', v)}
              />
              
              <SectionHeader>Table Colors</SectionHeader>
              <ColorPicker
                label="Background"
                value={currentTemplate.colors?.background}
                onChange={(v) => updateTemplate('colors.background', v)}
              />
              <ColorPicker
                label="Table Border"
                value={currentTemplate.colors?.tableBorder}
                onChange={(v) => updateTemplate('colors.tableBorder', v)}
              />
              <ColorPicker
                label="Table Header"
                value={currentTemplate.colors?.tableHeader}
                onChange={(v) => updateTemplate('colors.tableHeader', v)}
              />
              <ColorPicker
                label="Total Row BG"
                value={currentTemplate.colors?.totalRow}
                onChange={(v) => updateTemplate('colors.totalRow', v)}
              />
              <ColorPicker
                label="Total Row Text"
                value={currentTemplate.colors?.totalText}
                onChange={(v) => updateTemplate('colors.totalText', v)}
              />
              
              {/* Quick Presets */}
              <SectionHeader>Quick Presets</SectionHeader>
              <div className="grid grid-cols-4 gap-2">
                {templatePresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => updateTemplate('colors', preset.colors)}
                    className="p-2 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
                    title={preset.name}
                  >
                    <div 
                      className="w-full h-6 rounded"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              <SectionHeader>Fonts</SectionHeader>
              <Select
                label="Font Family"
                value={currentTemplate.typography?.fontFamily}
                onChange={(v) => updateTemplate('typography.fontFamily', v)}
                options={[
                  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
                  { value: 'Arial, sans-serif', label: 'Arial' },
                  { value: 'Georgia, serif', label: 'Georgia' },
                  { value: 'Times New Roman, serif', label: 'Times New Roman' },
                  { value: 'Courier New, monospace', label: 'Courier New' },
                ]}
              />
              
              <SectionHeader>Font Sizes</SectionHeader>
              <NumberInput
                label="Company Name"
                value={currentTemplate.typography?.companyNameSize}
                onChange={(v) => updateTemplate('typography.companyNameSize', v)}
                min={14}
                max={36}
                unit="px"
              />
              <NumberInput
                label="Invoice Title"
                value={currentTemplate.typography?.invoiceTitleSize}
                onChange={(v) => updateTemplate('typography.invoiceTitleSize', v)}
                min={12}
                max={28}
                unit="px"
              />
              <NumberInput
                label="Section Titles"
                value={currentTemplate.typography?.sectionTitleSize}
                onChange={(v) => updateTemplate('typography.sectionTitleSize', v)}
                min={10}
                max={16}
                unit="px"
              />
              <NumberInput
                label="Body Text"
                value={currentTemplate.typography?.bodySize}
                onChange={(v) => updateTemplate('typography.bodySize', v)}
                min={8}
                max={14}
                unit="px"
              />
              <NumberInput
                label="Small Text"
                value={currentTemplate.typography?.smallSize}
                onChange={(v) => updateTemplate('typography.smallSize', v)}
                min={7}
                max={12}
                unit="px"
              />
              
              <SectionHeader>Spacing</SectionHeader>
              <NumberInput
                label="Line Height"
                value={currentTemplate.typography?.lineHeight}
                onChange={(v) => updateTemplate('typography.lineHeight', v)}
                min={1}
                max={2}
                unit=""
              />
            </div>
          )}

          {/* Sections Tab */}
          {activeTab === 'sections' && (
            <div className="space-y-1">
              <SectionHeader>Header Elements</SectionHeader>
              <ToggleSwitch
                label="Company Logo"
                checked={currentTemplate.sections?.showLogo}
                onChange={(v) => updateTemplate('sections.showLogo', v)}
              />
              <ToggleSwitch
                label="Tagline"
                checked={currentTemplate.sections?.showTagline}
                onChange={(v) => updateTemplate('sections.showTagline', v)}
              />
              <ToggleSwitch
                label="GSTIN"
                checked={currentTemplate.sections?.showGST}
                onChange={(v) => updateTemplate('sections.showGST', v)}
              />
              <ToggleSwitch
                label="GEM ID"
                checked={currentTemplate.sections?.showGEMID}
                onChange={(v) => updateTemplate('sections.showGEMID', v)}
              />
              
              <SectionHeader>Invoice Details</SectionHeader>
              <ToggleSwitch
                label="PO Number"
                checked={currentTemplate.sections?.showPONumber}
                onChange={(v) => updateTemplate('sections.showPONumber', v)}
              />
              <ToggleSwitch
                label="Due Date"
                checked={currentTemplate.sections?.showDueDate}
                onChange={(v) => updateTemplate('sections.showDueDate', v)}
              />
              <ToggleSwitch
                label="Delivery Address"
                checked={currentTemplate.sections?.showDeliveryAddress}
                onChange={(v) => updateTemplate('sections.showDeliveryAddress', v)}
              />
              
              <SectionHeader>Footer Elements</SectionHeader>
              <ToggleSwitch
                label="Bank Details"
                checked={currentTemplate.sections?.showBankDetails}
                onChange={(v) => updateTemplate('sections.showBankDetails', v)}
              />
              <ToggleSwitch
                label="Terms & Conditions"
                checked={currentTemplate.sections?.showTerms}
                onChange={(v) => updateTemplate('sections.showTerms', v)}
              />
              <ToggleSwitch
                label="Signature Block"
                checked={currentTemplate.sections?.showSignature}
                onChange={(v) => updateTemplate('sections.showSignature', v)}
              />
              <ToggleSwitch
                label="Amount in Words"
                checked={currentTemplate.sections?.showAmountInWords}
                onChange={(v) => updateTemplate('sections.showAmountInWords', v)}
              />
              <ToggleSwitch
                label="QR Code"
                description="For UPI payments"
                checked={currentTemplate.sections?.showQRCode}
                onChange={(v) => updateTemplate('sections.showQRCode', v)}
              />
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <SectionHeader>Invoice Header</SectionHeader>
              <TextInput
                label="Invoice Title"
                value={currentTemplate.content?.invoiceTitle}
                onChange={(v) => updateTemplate('content.invoiceTitle', v)}
                placeholder="TAX INVOICE"
              />
              <TextInput
                label="Subtitle"
                value={currentTemplate.content?.invoiceSubtitle}
                onChange={(v) => updateTemplate('content.invoiceSubtitle', v)}
                placeholder="Original for Recipient"
              />
              
              <SectionHeader>Bank Details</SectionHeader>
              <TextInput
                label="Bank Name"
                value={currentTemplate.content?.bankDetails?.bankName}
                onChange={(v) => updateTemplate('content.bankDetails.bankName', v)}
                placeholder="State Bank of India"
              />
              <TextInput
                label="Account Number"
                value={currentTemplate.content?.bankDetails?.accountNumber}
                onChange={(v) => updateTemplate('content.bankDetails.accountNumber', v)}
                placeholder="1234567890"
              />
              <TextInput
                label="IFSC Code"
                value={currentTemplate.content?.bankDetails?.ifscCode}
                onChange={(v) => updateTemplate('content.bankDetails.ifscCode', v)}
                placeholder="SBIN0001234"
              />
              <TextInput
                label="Account Holder"
                value={currentTemplate.content?.bankDetails?.accountHolder}
                onChange={(v) => updateTemplate('content.bankDetails.accountHolder', v)}
                placeholder="Your Business Name"
              />
              
              <SectionHeader>Terms & Conditions</SectionHeader>
              <TextArea
                label="Terms (one per line)"
                value={currentTemplate.content?.termsAndConditions?.join('\n')}
                onChange={(v) => updateTemplate('content.termsAndConditions', v.split('\n').filter(t => t.trim()))}
                rows={4}
                placeholder="Payment due within 30 days..."
              />
              
              <SectionHeader>Footer</SectionHeader>
              <TextInput
                label="Footer Note"
                value={currentTemplate.content?.footerNote}
                onChange={(v) => updateTemplate('content.footerNote', v)}
                placeholder="Thank you for your business!"
              />
              <TextInput
                label="Signature Label"
                value={currentTemplate.content?.signatureLabel}
                onChange={(v) => updateTemplate('content.signatureLabel', v)}
                placeholder="Authorized Signatory"
              />
            </div>
          )}

          {/* Columns Tab */}
          {activeTab === 'columns' && (
            <div className="space-y-2">
              <SectionHeader>Table Columns</SectionHeader>
              <p className="text-xs text-gray-500 mb-4">
                Toggle which columns appear in your invoice items table.
              </p>
              
              {currentTemplate.columns?.map(col => (
                <div 
                  key={col.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleColumn(col.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        col.show
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {col.show && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>
                    <span className="text-white">{col.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{col.width}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                hasChanges
                  ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Save Template
            </button>
            
            {activeTemplateId !== currentTemplate.id && (
              <button
                onClick={handleSetActive}
                className="px-4 py-2.5 bg-green-500/20 text-green-400 rounded-lg font-medium text-sm hover:bg-green-500/30 transition-colors"
              >
                Set Active
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className={`flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden ${viewMode === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Preview Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <EyeIcon className="w-5 h-5" />
            <span className="font-medium">Live Preview</span>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Zoom:</span>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.1"
              value={previewScale}
              onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-xs text-gray-400 w-10">{Math.round(previewScale * 100)}%</span>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center' }}>
            <InvoicePreview
              ref={previewRef}
              invoice={sampleInvoice}
              template={currentTemplate}
              businessInfo={businessInfo}
              scale={1}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
