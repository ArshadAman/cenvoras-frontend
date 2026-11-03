import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getUserProfile } from '../../api/users';
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
  getActiveTemplateForSection,
  setActiveTemplateForSection,
  saveInvoiceTemplate,
  deleteInvoiceTemplate,
  createTemplateFromPreset,
  duplicateTemplate,
  documentTypeToSectionKey,
  templatePresets,
  defaultInvoiceTemplate,
  resolveTypography,
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
      {description && <p className="text-xs text-[var(--text-muted)]">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-subtle)]'
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
const NumberInput = ({ label, value, onChange, min = 0, max = 100, unit = '', step }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-16 px-2 py-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] text-center font-mono"
      />
      {unit && <span className="text-xs text-[var(--text-muted)]">{unit}</span>}
    </div>
  </div>
);

// Text Input Component
const TextInput = ({ label, value, onChange, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="form-label !mb-1">{label}</label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="form-input text-sm"
    />
  </div>
);

// Textarea Component
const TextArea = ({ label, value, onChange, rows = 3, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="form-label !mb-1">{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="form-input text-sm resize-none"
    />
  </div>
);

// Select Component
const Select = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)]"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
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
export default function InvoiceTemplateDesigner({ isOpen, onClose, businessInfo = {}, documentType = 'invoice', invoice = null }) {
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(defaultInvoiceTemplate);
  const [activeTab, setActiveTab] = useState('layout');
  const [previewScale, setPreviewScale] = useState(0.6);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [viewMode, setViewMode] = useState('design'); // 'design' or 'preview'
  const previewRef = useRef(null);

  const sectionKey = documentTypeToSectionKey(documentType);

  const isDeliveryChallan = Boolean(
    documentType === 'delivery_challan' ||
    invoice?.document_type === 'delivery_challan' ||
    invoice?.is_delivery_challan
  );

  // Fetch profile to get configured multi-bank accounts
  const { data: userProfileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const billingProfile = userProfileData?.billing_profile || userProfileData?.profile || {};
  const allBankAccounts = (billingProfile.bank_accounts && billingProfile.bank_accounts.length > 0)
    ? billingProfile.bank_accounts
    : (businessInfo.bank_accounts && businessInfo.bank_accounts.length > 0)
    ? businessInfo.bank_accounts
    : (billingProfile.bank_name || businessInfo.bank_name)
    ? [{
        id: 'bank_acc_1',
        account_name: 'Primary Account',
        bank_name: billingProfile.bank_name || businessInfo.bank_name || '',
        account_number: billingProfile.bank_account_number || businessInfo.bank_account_number || '',
        ifsc_code: billingProfile.bank_ifsc_code || businessInfo.bank_ifsc_code || '',
        account_holder: billingProfile.business_name || businessInfo.business_name || '',
        branch: billingProfile.bank_branch || businessInfo.bank_branch || '',
        upi_id: billingProfile.bank_upi_id || businessInfo.bank_upi_id || '',
        qr_code: billingProfile.bank_qr_code || businessInfo.bank_qr_code || '',
        is_default: true,
      }]
    : [];

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

  const sampleDeliveryChallan = {
    challan_number: 'DC-001',
    challan_date: new Date().toISOString(),
    invoice_number: 'DC-001',
    invoice_date: new Date().toISOString(),
    customer_name: 'Acme Corporation',
    customer_address: '123 Business Park, Tech City\nKarnataka, India - 560001',
    customer_gstin: '29AAKCG6382L1ZU',
    vehicle_number: 'KA-01-AB-1234',
    transporter_name: 'Fast Track Logistics',
    transport_mode: 'Road',
    eway_bill_number: 'EWB-998877665544',
    is_delivery_challan: true,
    document_type: 'delivery_challan',
    items: [
      { product: 'Industrial Valve 50mm', hsn_sac_code: '8481', quantity: 10, price: 2500, tax: 18, unit: 'pcs', make: 'Kitz', pack_size: 'Box of 5' },
      { product: 'Pressure Gauge 0-10 Bar', hsn_sac_code: '9026', quantity: 4, price: 1500, tax: 18, unit: 'nos', make: 'Baumer', pack_size: 'Single' },
      { product: 'Flange Gasket Kit', hsn_sac_code: '4016', quantity: 20, price: 350, tax: 18, unit: 'sets', make: 'Klinger', pack_size: 'Pack of 10' },
    ],
  };

  const previewInvoice = invoice
    ? {
        ...(isDeliveryChallan ? sampleDeliveryChallan : sampleInvoice),
        ...invoice,
        is_delivery_challan: isDeliveryChallan,
        document_type: documentType,
      }
    : isDeliveryChallan
    ? sampleDeliveryChallan
    : sampleInvoice;

  // Load templates for this section only
  useEffect(() => {
    if (isOpen) {
      const loadedTemplates = getInvoiceTemplates(sectionKey);
      setTemplates(loadedTemplates);
      
      const active = getActiveTemplateForSection({ sectionKey });
      setActiveTemplateId(active.id);
      setCurrentTemplate(active);
      setHasChanges(false);
    }
  }, [isOpen, sectionKey]);

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

  // Save current template (section-scoped — does not sync to other sections)
  const handleSave = () => {
    const saved = saveInvoiceTemplate(currentTemplate, sectionKey);
    if (saved) {
      setTemplates(getInvoiceTemplates(sectionKey));
      setHasChanges(false);
      toast.success('Template saved successfully!');
    } else {
      toast.error('Failed to save template');
    }
  };

  // Set as active template for this section only
  const handleSetActive = () => {
    setActiveTemplateForSection(sectionKey, currentTemplate.id);
    const refreshed = getInvoiceTemplates(sectionKey);
    const active = refreshed.find((t) => t.id === currentTemplate.id) || currentTemplate;
    setTemplates(refreshed);
    setCurrentTemplate(active);
    setActiveTemplateId(active.id);
    toast.success('Template set as default for this section!');
  };

  // Create new template
  const handleCreateNew = () => {
    const newName = prompt('Enter template name:', 'My Custom Template');
    if (newName) {
      const newTemplate = createTemplateFromPreset('classic', newName, sectionKey);
      if (newTemplate) {
        setActiveTemplateForSection(sectionKey, newTemplate.id);
        const refreshed = getInvoiceTemplates(sectionKey);
        const active = refreshed.find((t) => t.id === newTemplate.id) || newTemplate;
        setTemplates(refreshed);
        setCurrentTemplate(active);
        setActiveTemplateId(active.id);
        toast.success('New template created!');
      }
    }
  };

  // Duplicate template
  const handleDuplicate = () => {
    const duplicated = duplicateTemplate(currentTemplate.id, sectionKey);
    if (duplicated) {
      setTemplates(getInvoiceTemplates(sectionKey));
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
      deleteInvoiceTemplate(currentTemplate.id, sectionKey);
      const remaining = getInvoiceTemplates(sectionKey);
      const next = remaining.find((t) => t.isDefault) || remaining[0] || defaultInvoiceTemplate;
      setTemplates(remaining);
      setCurrentTemplate(next);
      setActiveTemplateId(next?.id || null);
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
    { id: 'typography', label: 'Font', icon: DocumentTextIcon },
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
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'design' ? 'text-[var(--accent-primary)] bg-[var(--action-primary-bg)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}
        >
          Design
        </button>
        <button 
          onClick={() => setViewMode('preview')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'text-[var(--accent-primary)] bg-[var(--action-primary-bg)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}
        >
          Preview
        </button>
      </div>

      {/* Left Panel - Settings */}
      <div className={`w-full lg:w-96 bg-[#111] border-r border-white/10 flex flex-col h-full ${viewMode === 'design' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isDeliveryChallan ? 'Challan Designer' : 'Invoice Designer'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isDeliveryChallan ? 'Customize your delivery challan template' : 'Customize your invoice template'}
            </p>
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
            {(templates.find((t) => t.isDefault)?.id === currentTemplate.id || activeTemplateId === currentTemplate.id) && (
              <span className="text-xs bg-[var(--action-primary-bg)] text-[var(--accent-primary)] border border-[var(--action-primary-border)] px-2 py-0.5 rounded">Active</span>
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
                  {template.isDefault && (
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
                  { value: 'service', label: 'Service Template' },
                  { value: 'legend', label: 'Legend Corporate' },
                  { value: 'billship', label: 'Bill To - Ship To' },
                ]}
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">
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
                    <p className="text-xs text-[var(--text-muted)]">Max 500KB, JPG/PNG</p>
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

          {/* Font Tab */}
          {activeTab === 'typography' && (() => {
            const type = resolveTypography(currentTemplate.typography);
            const setSize = (field) => (v) => updateTemplate(`typography.${field}`, v);
            return (
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

              <SectionHeader>Header</SectionHeader>
              <NumberInput label="Company Name" value={type.companyNameSize} onChange={setSize('companyNameSize')} min={14} max={36} unit="px" />
              <NumberInput label="Company Address" value={type.companyAddressSize} onChange={setSize('companyAddressSize')} min={7} max={16} unit="px" />

              <SectionHeader>Document</SectionHeader>
              <NumberInput label="Invoice Title" value={type.invoiceTitleSize} onChange={setSize('invoiceTitleSize')} min={12} max={32} unit="px" />
              <NumberInput label="Invoice Details" value={type.bodySize} onChange={setSize('bodySize')} min={8} max={16} unit="px" />
              <NumberInput label="Section Titles" value={type.sectionTitleSize} onChange={setSize('sectionTitleSize')} min={8} max={18} unit="px" />

              <SectionHeader>Parties</SectionHeader>
              <NumberInput label="Customer Name" value={type.customerNameSize} onChange={setSize('customerNameSize')} min={8} max={18} unit="px" />
              <NumberInput label="Bill / Ship Address" value={type.addressSize} onChange={setSize('addressSize')} min={7} max={16} unit="px" />

              <SectionHeader>Table</SectionHeader>
              <NumberInput label="Table Header" value={type.tableHeaderSize} onChange={setSize('tableHeaderSize')} min={7} max={14} unit="px" />
              <NumberInput label="Line Items" value={type.tableBodySize} onChange={setSize('tableBodySize')} min={7} max={16} unit="px" />
              <NumberInput label="Line Notes" value={type.smallSize} onChange={setSize('smallSize')} min={7} max={14} unit="px" />

              <SectionHeader>Totals</SectionHeader>
              <NumberInput label="Totals" value={type.totalsSize} onChange={setSize('totalsSize')} min={8} max={18} unit="px" />

              <SectionHeader>Bank</SectionHeader>
              <NumberInput label="Bank Details" value={type.bankDetailsSize} onChange={setSize('bankDetailsSize')} min={7} max={16} unit="px" />

              <SectionHeader>Terms / Footer</SectionHeader>
              <NumberInput label="Terms / Footer" value={type.footerSize} onChange={setSize('footerSize')} min={7} max={14} unit="px" />

              <SectionHeader>Spacing</SectionHeader>
              <NumberInput
                label="Line Height"
                value={type.lineHeight}
                onChange={setSize('lineHeight')}
                min={1}
                max={2}
                step={0.1}
                unit=""
              />
            </div>
            );
          })()}

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
              <div className="py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-white">Bank Account to Print</span>
                  <span className="text-xs text-gray-400">Profile Linked</span>
                </div>
                <select
                  value={currentTemplate.content?.bankAccountId || (currentTemplate.content?.hideBankDetails ? 'none' : (allBankAccounts[0]?.id || ''))}
                  onChange={(e) => {
                    const selId = e.target.value;
                    if (selId === 'none') {
                      updateTemplate('content.bankAccountId', 'none');
                      updateTemplate('content.hideBankDetails', true);
                      updateTemplate('content.bankDetails', { bankName: '', accountNumber: '', ifscCode: '', accountHolder: '' });
                    } else {
                      const acc = allBankAccounts.find(a => a.id === selId);
                      if (acc) {
                        updateTemplate('content.bankAccountId', acc.id);
                        updateTemplate('content.hideBankDetails', false);
                        updateTemplate('content.bankDetails', {
                          bankName: acc.bank_name || '',
                          accountNumber: acc.account_number || '',
                          ifscCode: acc.ifsc_code || '',
                          accountHolder: acc.account_holder || '',
                          branch: acc.branch || '',
                          upiId: acc.upi_id || '',
                        });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="none" className="bg-[var(--bg-surface)] text-[var(--text-muted)]">Do not print bank details (None)</option>
                  {allBankAccounts.map((acc, idx) => (
                    <option key={acc.id || idx} value={acc.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                      {acc.account_name || `Account ${idx + 1}`} {acc.bank_name ? `• ${acc.bank_name}` : ''} {acc.account_number ? `(••••${acc.account_number.slice(-4)})` : ''}{acc.is_default ? ' [Default]' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  Choose which profile account to print. To add or edit accounts, visit Profile → Bank & Payment Details.
                </p>

                {(() => {
                  const selId = currentTemplate.content?.bankAccountId;
                  const isNone = selId === 'none' || currentTemplate.content?.hideBankDetails;
                  if (isNone) return null;
                  const activeAcc = allBankAccounts.find(a => a.id === selId) || allBankAccounts[0];
                  if (!activeAcc || (!activeAcc.bank_name && !activeAcc.account_number)) return null;
                  return (
                    <div className="mt-3 p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 text-xs space-y-1.5">
                      <div className="flex justify-between text-gray-300">
                        <span>Bank: <strong className="text-white font-medium">{activeAcc.bank_name || '—'}</strong></span>
                        <span>IFSC: <strong className="text-white font-mono">{activeAcc.ifsc_code || '—'}</strong></span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>A/C: <strong className="text-white font-mono">{activeAcc.account_number || '—'}</strong></span>
                        {activeAcc.account_holder && (
                          <span>Holder: <strong className="text-white font-medium">{activeAcc.account_holder}</strong></span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
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
              <p className="text-xs text-[var(--text-muted)] mb-4">
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
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {col.show && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>
                    <span className="text-white">{col.label}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{col.width}</span>
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
                  ? 'btn-primary'
                  : 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
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
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-[var(--bg-primary)]">
          <div 
            style={{ 
              transform: `scale(${previewScale})`, 
              transformOrigin: 'top center',
              width: '210mm',
              marginBottom: previewScale < 1 ? `calc(297mm * (${previewScale} - 1))` : 0,
            }}
          >
            <div className="shadow-2xl bg-white" data-bill-template="true">
              <InvoicePreview
                ref={previewRef}
                invoice={previewInvoice}
                documentType={documentType}
                template={currentTemplate}
                businessInfo={businessInfo}
                scale={1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
