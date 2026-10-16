import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesInvoice, downloadSalesInvoicePDF, patchSalesInvoice } from "../../api/sales";
import { getQuotation, downloadQuotationPDF, patchQuotation } from "../../api/quotation";
import { getDeliveryChallan, getDeliveryChallanPdf, patchDeliveryChallan } from "../../api/delivery_challan";
import { getSalesOrder, downloadSalesOrderPDF, patchSalesOrder } from "../../api/sales_order";
import { useReactToPrint } from "react-to-print";
import { 
  XMarkIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon, 
  PaintBrushIcon, 
  EnvelopeIcon, 
  ArrowPathIcon, 
  ChevronDownIcon, 
  BoltIcon, 
  SparklesIcon, 
  DocumentTextIcon, 
  BuildingLibraryIcon, 
  SwatchIcon 
} from "@heroicons/react/24/outline";
import { toast } from 'react-toastify';

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
  );
}
import { sendCustomEmail } from '../../api/integrations';
import InvoicePreview from "../invoice/InvoicePreview";
import InvoiceTemplateDesigner from "../invoice/InvoiceTemplateDesigner";
import { getActiveTemplate, setActiveTemplate, getInvoiceTemplates, getActiveTemplateForSection, setActiveTemplateForSection } from "../../utils/invoiceSettings";
import { getInvoiceSettings } from "../../api/invoice_settings";
import { getUserProfile, patchUserProfile } from "../../api/users";
import { patchCustomer } from "../../api/customers";
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { generatePixelPerfectPDF } from "../../utils/pdfEngine";
import { paginateInvoiceItems } from "../../utils/invoicePaginator";
import { serializeInvoiceHtml } from "../../utils/htmlInvoiceSerializer";
import { buildThemedInvoiceEmailHtml } from "../../utils/invoiceEmailGenerator";

export default function SalesDetailsModal({ isOpen, onClose, invoice, businessInfo = {}, documentType = "invoice" }) {
  const queryClient = useQueryClient();
  const printRef = useRef();
  const previewContainerRef = useRef(null);
  const pdfMenuRef = useRef(null);
  const [template, setTemplate] = useState(null);
  const [showDesigner, setShowDesigner] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(null);

  const isQuotation = documentType === "quotation";
  const isDeliveryChallan = documentType === "delivery_challan";
  const isSalesOrder = documentType === "sales_order" || documentType === "proforma";
  const sectionKey = isQuotation ? 'quotation' : isDeliveryChallan ? 'delivery_challan' : isSalesOrder ? 'sales_order' : 'sales_invoice';

  // Fetch user profile to ensure business & bank details are always populated
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const billingProfile = userProfile?.billing_profile || userProfile?.profile || {};
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

  // Fetch invoice/quotation/challan/sales order details
  const { data: invoiceDetails = {}, isLoading } = useQuery({
    queryKey: [
      isDeliveryChallan
        ? "deliveryChallan"
        : isQuotation
        ? "quotation"
        : isSalesOrder
        ? "salesOrder"
        : "salesInvoice",
      invoice?.id,
    ],
    queryFn: () =>
      isDeliveryChallan
        ? getDeliveryChallan(invoice?.id)
        : isQuotation
        ? getQuotation(invoice?.id)
        : isSalesOrder
        ? getSalesOrder(invoice?.id)
        : getSalesInvoice(invoice?.id),
    enabled: isOpen && !!invoice?.id,
  });

  // Resolve active bank account: bill-specific override -> section default -> default account -> first account
  const billBankAccountId = invoiceDetails?.bank_account_id || invoice?.bank_account_id || invoiceDetails?.meta?.bank_account_id || invoice?.meta?.bank_account_id;
  const sectionDefaultBankAccountId = billingProfile?.default_bank_account_sections?.[sectionKey];

  useEffect(() => {
    if (billBankAccountId !== undefined && billBankAccountId !== null && billBankAccountId !== '') {
      setSelectedBankAccountId(billBankAccountId);
    } else if (sectionDefaultBankAccountId) {
      setSelectedBankAccountId(sectionDefaultBankAccountId);
    } else if (allBankAccounts.length > 0) {
      const defaultAcc = allBankAccounts.find(a => a.is_default) || allBankAccounts[0];
      setSelectedBankAccountId(defaultAcc ? defaultAcc.id : 'none');
    } else {
      setSelectedBankAccountId('none');
    }
  }, [billBankAccountId, sectionDefaultBankAccountId, allBankAccounts.length]);

  const activeBankAcc = selectedBankAccountId === 'none'
    ? null
    : allBankAccounts.find(a => a.id === selectedBankAccountId)
      || allBankAccounts.find(a => a.is_default)
      || allBankAccounts[0]
      || null;

  const handleBankSelect = async (newId) => {
    setSelectedBankAccountId(newId);

    // 1. Update default bank account for this section in user profile
    try {
      const currentSectionDefaults = billingProfile.default_bank_account_sections || {};
      if (currentSectionDefaults[sectionKey] !== newId) {
        await patchUserProfile({
          default_bank_account_sections: {
            ...currentSectionDefaults,
            [sectionKey]: newId,
          }
        });
        queryClient.invalidateQueries(['userProfile']);
      }
    } catch (err) {
      console.warn('Failed to update section default bank account:', err);
    }

    // 2. Persist override to current document
    const docId = invoice?.id;
    if (docId) {
      const payload = { bank_account_id: newId === 'none' ? '' : newId };
      try {
        if (isDeliveryChallan) {
          await patchDeliveryChallan(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['deliveryChallan', docId] });
        } else if (isQuotation) {
          await patchQuotation(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['quotation', docId] });
        } else if (isSalesOrder) {
          await patchSalesOrder(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['salesOrder', docId] });
        } else {
          await patchSalesInvoice(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['salesInvoice', docId] });
        }
        toast.success('Bank account updated for this bill');
      } catch (err) {
        console.warn('Failed to save bank account to bill:', err);
      }
    }
  };

  const effectiveBusinessInfo = {
    business_name: billingProfile.business_name,
    business_address: billingProfile.business_address,
    phone: billingProfile.phone,
    email: billingProfile.email,
    gstin: billingProfile.gstin,
    pan_number: billingProfile.pan_number,
    gem_id: billingProfile.gem_id,
    dl_number: billingProfile.dl_number,
    state: billingProfile.state,
    city: billingProfile.city,
    country: billingProfile.country,
    trn: billingProfile.trn,
    bank_name: activeBankAcc ? activeBankAcc.bank_name : '',
    bank_account_number: activeBankAcc ? activeBankAcc.account_number : '',
    bank_ifsc_code: activeBankAcc ? activeBankAcc.ifsc_code : '',
    bank_branch: activeBankAcc ? (activeBankAcc.branch || '') : '',
    bank_upi_id: activeBankAcc ? activeBankAcc.upi_id : '',
    bank_qr_code: activeBankAcc ? activeBankAcc.qr_code : '',
    bank_accounts: allBankAccounts,
    hide_bank_details: selectedBankAccountId === 'none',
    ...businessInfo,
  };
  if (selectedBankAccountId === 'none') {
    effectiveBusinessInfo.bank_name = '';
    effectiveBusinessInfo.bank_account_number = '';
    effectiveBusinessInfo.bank_ifsc_code = '';
    effectiveBusinessInfo.bank_branch = '';
    effectiveBusinessInfo.bank_upi_id = '';
    effectiveBusinessInfo.bank_qr_code = '';
    effectiveBusinessInfo.hide_bank_details = true;
  } else if (activeBankAcc) {
    effectiveBusinessInfo.bank_name = activeBankAcc.bank_name || '';
    effectiveBusinessInfo.bank_account_number = activeBankAcc.account_number || '';
    effectiveBusinessInfo.bank_ifsc_code = activeBankAcc.ifsc_code || '';
    effectiveBusinessInfo.bank_branch = activeBankAcc.branch || '';
    effectiveBusinessInfo.bank_upi_id = activeBankAcc.upi_id || '';
    effectiveBusinessInfo.bank_qr_code = activeBankAcc.qr_code || '';
    effectiveBusinessInfo.hide_bank_details = false;
  }

  const customerId = invoiceDetails?.customer?.id || invoiceDetails?.customer_id || invoice?.customer_id || invoice?.customer?.id || null;
  const customerTemplates = invoiceDetails?.customer?.preview_templates || invoiceDetails?.customer_details?.preview_templates || invoiceDetails?.preview_templates || invoice?.preview_templates || null;
  const userDefaultTemplates = billingProfile?.default_preview_template_sections || null;
  const docTemplateId = invoiceDetails?.template_id || invoice?.template_id || null;

  // Load active template scoped per section and per customer (no cross-syncing)
  useEffect(() => {
    if (isOpen) {
      const resolvedTemplate = getActiveTemplateForSection({
        sectionKey,
        documentTemplateId: docTemplateId,
        customerTemplates,
        userDefaultTemplates,
      });
      setTemplate(resolvedTemplate);
    }
  }, [isOpen, sectionKey, docTemplateId, JSON.stringify(customerTemplates), JSON.stringify(userDefaultTemplates)]);

  const handleTemplateSwitch = async (targetId) => {
    setActiveTemplateForSection(sectionKey, targetId);
    const chosen = getActiveTemplateForSection({
      sectionKey,
      documentTemplateId: targetId,
      customerTemplates,
      userDefaultTemplates,
    });
    setTemplate(chosen);

    // 1. Persist template to current bill
    const docId = invoice?.id;
    if (docId) {
      const payload = { template_id: targetId };
      try {
        if (isDeliveryChallan) {
          await patchDeliveryChallan(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['deliveryChallan', docId] });
        } else if (isQuotation) {
          await patchQuotation(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['quotation', docId] });
        } else if (isSalesOrder) {
          await patchSalesOrder(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['salesOrder', docId] });
        } else {
          await patchSalesInvoice(docId, payload);
          queryClient.invalidateQueries({ queryKey: ['salesInvoice', docId] });
        }
      } catch (err) {
        console.warn('Failed to save template_id to bill:', err);
      }
    }

    // 2. Persist to customer's section format preferences if customer exists
    if (customerId) {
      try {
        await patchCustomer(customerId, {
          meta: {
            preview_templates: {
              ...(customerTemplates || {}),
              [sectionKey]: targetId,
            }
          }
        });
        queryClient.invalidateQueries(['customer', customerId]);
        queryClient.invalidateQueries(['customers']);
      } catch (err) {
        console.warn('Failed to update customer preview_templates:', err);
      }
    }

    // 3. Persist as section default in UserProfile
    try {
      const currentSectionDefaults = billingProfile.default_preview_template_sections || {};
      if (currentSectionDefaults[sectionKey] !== targetId) {
        await patchUserProfile({
          default_preview_template_sections: {
            ...currentSectionDefaults,
            [sectionKey]: targetId,
          }
        });
        queryClient.invalidateQueries(['userProfile']);
      }
    } catch (err) {
      console.warn('Failed to update section default preview template:', err);
    }
  };

  // Close PDF options dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target)) {
        setPdfMenuOpen(false);
      }
    };
    if (pdfMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [pdfMenuOpen]);

  // Dynamically calculate preview scale so A4 sheet (794px width) fits smaller viewports without distortion
  useEffect(() => {
    if (!isOpen) return;
    const updatePreviewScale = () => {
      const container = previewContainerRef.current;
      const width = container ? container.clientWidth : window.innerWidth;
      // Target A4 width is 794px (210mm at 96 DPI) + 32px padding
      const targetWidth = 794;
      if (width < targetWidth + 32) {
        const s = Math.max(0.35, Math.min(1, (width - 32) / targetWidth));
        setPreviewScale(Number(s.toFixed(3)));
      } else {
        setPreviewScale(1);
      }
    };

    updatePreviewScale();
    window.addEventListener('resize', updatePreviewScale);
    return () => window.removeEventListener('resize', updatePreviewScale);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (showDesigner) {
          setShowDesigner(false);
        } else if (emailPromptOpen) {
          setEmailPromptOpen(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDesigner, emailPromptOpen, onClose]);

  // Fetch tenant invoice settings
  const { data: invoiceSettings } = useQuery({
    queryKey: ['invoiceSettings'],
    queryFn: getInvoiceSettings,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  if (invoiceSettings && typeof invoiceSettings.show_cenvora_footer === 'boolean') {
    effectiveBusinessInfo.show_cenvora_footer = invoiceSettings.show_cenvora_footer;
  } else if (effectiveBusinessInfo.show_cenvora_footer === undefined) {
    const plan = String(effectiveBusinessInfo.plan_code || 'free').toLowerCase();
    effectiveBusinessInfo.show_cenvora_footer = plan !== 'business';
  }

  const baseTitle = isQuotation ? "QUOTATION" : isDeliveryChallan ? "DELIVERY CHALLAN" : isSalesOrder ? "PROFORMA INVOICE" : (template?.content?.invoiceTitle || "TAX INVOICE");
  const previewTemplate = {
    ...template,
    content: {
      ...(template?.content || {}),
      invoiceTitle: baseTitle,
      hideBankDetails: selectedBankAccountId === 'none',
      bankDetails: activeBankAcc ? {
        bankName: activeBankAcc.bank_name || '',
        accountNumber: activeBankAcc.account_number || '',
        ifscCode: activeBankAcc.ifsc_code || '',
        accountHolder: activeBankAcc.account_holder || '',
        branch: activeBankAcc.branch || '',
        upiId: activeBankAcc.upi_id || '',
      } : { bankName: '', accountNumber: '', ifscCode: '', accountHolder: '', branch: '' },
    },
  };

  const enrichedInvoice = {
    ...invoiceDetails,
    document_type: documentType,
    is_delivery_challan: isDeliveryChallan,
    challan_number:
      invoiceDetails.challan_number ||
      invoice?.challan_number ||
      (isDeliveryChallan ? invoiceDetails.invoice_number || invoice?.invoice_number : ''),
    challan_date:
      invoiceDetails.date ||
      invoiceDetails.challan_date ||
      invoice?.date ||
      invoice?.challan_date ||
      '',
    vehicle_number: invoiceDetails.vehicle_number || invoice?.vehicle_number || '',
    transport_mode: invoiceDetails.transport_mode || invoice?.transport_mode || '',
    transporter_name: invoiceDetails.transporter_name || invoice?.transporter_name || '',
    sales_order_number:
      invoiceDetails.sales_order_number ||
      invoice?.sales_order_number ||
      invoiceDetails.sales_order_details?.order_number ||
      '',
    invoice_number:
      invoiceDetails.quotation_number ||
      invoiceDetails.order_number ||
      invoiceDetails.invoice_number ||
      invoiceDetails.challan_number ||
      invoice?.order_number ||
      invoice?.quotation_number ||
      invoice?.challan_number ||
      invoice?.invoice_number ||
      '',
    invoice_date:
      invoiceDetails.invoice_date ||
      invoiceDetails.date ||
      invoice?.date ||
      invoice?.invoice_date ||
      '',
    customer_name:
      invoiceDetails.customer_name ||
      invoiceDetails.customer_display_name ||
      invoiceDetails.customer?.name ||
      invoice?.customer_name ||
      '',
    po_number:
      invoiceDetails.po_number ||
      invoiceDetails.sales_order_number ||
      invoice?.sales_order_number ||
      (invoiceDetails.sales_order_details?.order_number
        ? `SO #${invoiceDetails.sales_order_details.order_number}`
        : '') ||
      '',
    items:
      (Array.isArray(invoiceDetails.items) && invoiceDetails.items.length > 0)
        ? invoiceDetails.items
        : (Array.isArray(invoice?.items) && invoice?.items.length > 0)
        ? invoice.items
        : invoiceDetails.items || invoice?.items || [],
  };

  // Print functionality with anti-slicing CSS rules
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${isDeliveryChallan ? "Delivery-Challan" : isQuotation ? "Quotation" : isSalesOrder ? "Proforma-Invoice" : "Invoice"}-${enrichedInvoice.invoice_number || invoice?.id}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      @page :left {
        margin: 0mm;
      }
      @page :right {
        margin: 0mm;
      }
      @media print {
        *, *::before, *::after {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          background: #ffffff !important;
        }
        thead {
          display: table-header-group !important;
        }
        tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .print-hidden, [data-no-print], button {
          display: none !important;
        }
        .invoice-container {
          display: block !important;
          gap: 0 !important;
        }
        .invoice-sheet {
          box-shadow: none !important;
          transform: none !important;
          background: #ffffff !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          page-break-after: always !important;
          break-after: page !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .invoice-sheet:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .invoice-part-header {
          flex-shrink: 0 !important;
        }
        .invoice-part-items {
          flex-grow: 1 !important;
        }
        .invoice-part-footer {
          margin-top: auto !important;
          flex-shrink: 0 !important;
        }
        .invoice-part-continuation {
          margin-top: auto !important;
          flex-shrink: 0 !important;
        }
        [data-print-target] {
          width: 100% !important;
          max-width: 100% !important;
          min-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          background: #ffffff !important;
          transform: none !important;
        }
      }
    `,
  });

  // High-Quality PDF Download: Vector PDF (Chrome vector, exact replica) or Client Engine (300+ DPI)
  const handleDownloadPDF = async (engine = 'vector') => {
    if (!printRef.current || !invoiceDetails) return;
    setDownloadingPDF(true);
    setPdfMenuOpen(false);

    const docTypeLabel = isDeliveryChallan
      ? 'Delivery Challan'
      : isQuotation
      ? 'Quotation'
      : isSalesOrder
      ? 'Proforma Invoice'
      : 'Invoice';
    const filePrefix = isDeliveryChallan
      ? "delivery-challan"
      : isQuotation
      ? "quotation"
      : isSalesOrder
      ? "proforma-invoice"
      : "invoice";
    const fileNum =
      enrichedInvoice.invoice_number ||
      invoiceDetails.order_number ||
      invoiceDetails.quotation_number ||
      invoiceDetails.invoice_number ||
      invoiceDetails.challan_number ||
      invoice?.id ||
      'doc';
    const filename = `${filePrefix}-${fileNum}.pdf`;

    try {
      const targetElement = printRef.current?.querySelector('[data-print-target]') || printRef.current;

      if (engine === 'vector' && invoiceDetails.id && targetElement) {
        try {
          const serializedHtml = serializeInvoiceHtml(targetElement);
          const payload = {
            html: serializedHtml,
            template: previewTemplate || {},
          };

          let blob;
          if (isDeliveryChallan) {
            blob = await getDeliveryChallanPdf(invoiceDetails.id, payload);
          } else if (isQuotation) {
            blob = await downloadQuotationPDF(invoiceDetails.id, payload);
          } else if (isSalesOrder) {
            blob = await downloadSalesOrderPDF(invoiceDetails.id, payload);
          } else {
            blob = await downloadSalesInvoicePDF(invoiceDetails.id, payload);
          }

          const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);

          toast.success(`${docTypeLabel} pixel-perfect PDF downloaded (~20KB, crystal clear)`);
          return;
        } catch (apiError) {
          console.warn('Backend vector PDF download unavailable (501), generating direct fallback:', apiError);
          toast.info('Server Chromium updating on api.cenvora.co.in. Generating direct download (or select "Save as Vector PDF").', { autoClose: 4000 });
        }
      }

      if (targetElement) {
        await generatePixelPerfectPDF(targetElement, {
          filename,
          scale: 2.5,
          imageFormat: 'JPEG',
          quality: 0.92,
        });

        toast.success(`${docTypeLabel} PDF downloaded successfully`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Send invoice email helper using the user's SELECTED invoice theme
  const sendInvoiceEmail = async (email) => {
    setSendingEmail(true);
    try {
      const businessName = effectiveBusinessInfo.business_name || businessInfo.business_name || 'Company';
      const docTypeLabel = isDeliveryChallan
        ? 'Delivery Challan'
        : isQuotation
        ? 'Quotation'
        : isSalesOrder
        ? 'Proforma Invoice'
        : 'Tax Invoice';
      const fileNum =
        enrichedInvoice.invoice_number ||
        invoiceDetails.order_number ||
        invoiceDetails.quotation_number ||
        invoiceDetails.invoice_number ||
        invoiceDetails.challan_number ||
        '';
      const subject = `${docTypeLabel} #${fileNum} from ${businessName}`;

      // Build beautifully styled email using the user's SELECTED invoice template/theme
      const currentActiveTemplate = previewTemplate || template;
      const themedEmailHtml = buildThemedInvoiceEmailHtml({
        invoice: enrichedInvoice,
        template: currentActiveTemplate,
        businessInfo: effectiveBusinessInfo,
        currencySymbol: getCurrencySymbol(),
        docTypeLabel,
      });

      const plainTextSummary = `Dear ${enrichedInvoice.customer_name || 'Customer'},\n\nPlease find attached your ${docTypeLabel} #${fileNum} for ${getCurrencySymbol()}${Number(enrichedInvoice.total_amount || 0).toFixed(2)} from ${businessName}.\n\nThank you for your business!`;

      await sendCustomEmail({
        recipient: email,
        subject,
        body: plainTextSummary,
        html_body: themedEmailHtml,
        invoice_id: invoiceDetails.id,
      });

      toast.success(`${docTypeLabel} emailed in "${currentActiveTemplate?.name || 'Selected'}" theme to ${email}`);
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setEmailPromptOpen(false);
      setManualEmail('');
    } catch (err) {
      console.error('Failed to send invoice email:', err);
      toast.error('Failed to send email. Check your email configuration in Business Tools.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle email button click
  const handleEmailClick = () => {
    const email =
      invoiceDetails?.customer_email ||
      invoiceDetails?.customer_details?.email ||
      invoiceDetails?.customer?.email;
    if (!email) {
      setEmailPromptOpen(true);
      return;
    }
    sendInvoiceEmail(email);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Email Prompt Modal */}
      {emailPromptOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEmailPromptOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 animate-fade-up">
            <h3 className="text-lg font-bold text-white mb-2">Enter Customer Email</h3>
            <p className="text-sm text-gray-400 mb-4">
              No email is on file for this customer. Enter an email to send this invoice.
            </p>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualEmail.includes('@') && sendInvoiceEmail(manualEmail)}
              placeholder="customer@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setEmailPromptOpen(false); setManualEmail(''); }}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendInvoiceEmail(manualEmail)}
                disabled={!manualEmail.includes('@') || sendingEmail}
                className="px-5 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-sm font-semibold hover:bg-cyan-500/30 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {sendingEmail ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sending...</> : <><EnvelopeIcon className="w-4 h-4" /> Send Invoice</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
          
          {/* Modernized Header */}
          <div className="relative z-30 flex flex-col md:flex-row items-start md:items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d0d14]/95 backdrop-blur-md gap-3">
            {/* Left section: Document Title, Badge, Theme & Bank Selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                  {isDeliveryChallan ? "Delivery Challan Preview" : isQuotation ? "Quotation Preview" : isSalesOrder ? "Proforma Invoice Preview" : "Invoice Preview"}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {enrichedInvoice.invoice_number || 'Draft'}
                </span>
              </div>

              {/* Subtle separator */}
              <div className="hidden sm:block h-4 w-px bg-white/10 mx-0.5" />

              {/* Theme & Bank Switcher Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Instant Template Switcher Dropdown */}
                <div className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-gray-300 rounded-lg px-2.5 py-1.5 transition-colors shadow-sm">
                  <SwatchIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <select
                    value={template?.id || 'classic'}
                    onChange={(e) => handleTemplateSwitch(e.target.value)}
                    className="bg-transparent text-gray-200 text-xs font-medium outline-none cursor-pointer pr-1"
                    title="Switch template"
                  >
                    {getInvoiceTemplates().map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#14141f] text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instant Bank Account Switcher Dropdown */}
                {allBankAccounts.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-gray-300 rounded-lg px-2.5 py-1.5 transition-colors shadow-sm max-w-[210px]">
                    <BuildingLibraryIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <select
                      value={selectedBankAccountId || 'none'}
                      onChange={(e) => handleBankSelect(e.target.value)}
                      className="bg-transparent text-gray-200 text-xs font-medium outline-none cursor-pointer truncate pr-1"
                      title="Select bank account to display on bill"
                    >
                      <option value="none" className="bg-[#14141f] text-gray-400">
                        No Bank Details
                      </option>
                      {allBankAccounts.map((acc, idx) => (
                        <option key={acc.id || idx} value={acc.id} className="bg-[#14141f] text-white">
                          {acc.account_name || `Account ${idx + 1}`}{acc.bank_name ? ` (${acc.bank_name})` : ''}{billingProfile.default_bank_account_sections?.[sectionKey] === acc.id ? ' [Default]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Right section: Clean Icon-Based Action Toolbar */}
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 backdrop-blur-md self-end md:self-center shrink-0">
              {/* Customize Template Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowDesigner(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-purple-300 hover:bg-purple-500/15 active:scale-95 transition-all duration-150"
                  title="Customize Template"
                  aria-label="Customize Template"
                >
                  <PaintBrushIcon className="w-4 h-4" />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#181824] text-gray-200 text-[11px] font-medium rounded-md shadow-2xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Customize Template
                </div>
              </div>

              {/* Print Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-300 hover:bg-blue-500/15 active:scale-95 transition-all duration-150"
                  title="Print Document"
                  aria-label="Print Document"
                >
                  <PrinterIcon className="w-4 h-4" />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#181824] text-gray-200 text-[11px] font-medium rounded-md shadow-2xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Print Document
                </div>
              </div>

              {/* PDF Download Split Button */}
              <div ref={pdfMenuRef} className="relative group/pdf">
                <div className={`flex items-center rounded-lg transition-colors ${pdfMenuOpen ? 'bg-white/10 text-emerald-400 ring-1 ring-emerald-500/30' : 'hover:bg-white/5'}`}>
                  <button
                    type="button"
                    disabled={downloadingPDF}
                    onClick={() => handleDownloadPDF('vector')}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/15 rounded-l-lg transition-colors disabled:opacity-50"
                    title="Download Vector PDF"
                    aria-label="Download Vector PDF"
                  >
                    {downloadingPDF ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={downloadingPDF}
                    onClick={() => setPdfMenuOpen(!pdfMenuOpen)}
                    className="w-4 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/15 rounded-r-lg transition-colors disabled:opacity-50 border-l border-white/5"
                    title="PDF Download Options"
                    aria-label="PDF Download Options"
                  >
                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${pdfMenuOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>
                </div>

                {!pdfMenuOpen && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#181824] text-gray-200 text-[11px] font-medium rounded-md shadow-2xl border border-white/10 whitespace-nowrap opacity-0 group-hover/pdf:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    Download PDF
                  </div>
                )}

                {pdfMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-[#14141f] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF('vector')}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-start gap-2.5 group/opt"
                    >
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <BoltIcon className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-200 group-hover/opt:text-white">Download Vector PDF</span>
                        <span className="text-[11px] text-gray-400">~20KB, crystal-clear direct vector file</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPDF('client')}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-start gap-2.5 mt-1 border-t border-white/5 pt-2 group/opt"
                    >
                      <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-200 group-hover/opt:text-white">Direct Canvas Download</span>
                        <span className="text-[11px] text-gray-400">~45KB, high-res client fallback</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPdfMenuOpen(false); handlePrint(); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-start gap-2.5 mt-1 border-t border-white/5 pt-2 group/opt"
                    >
                      <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <PrinterIcon className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-200 group-hover/opt:text-white">System Print Dialog</span>
                        <span className="text-[11px] text-gray-400">Print or choose destination printer</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Email Button */}
              <div className="relative group">
                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={handleEmailClick}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-sky-300 hover:bg-sky-500/15 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Send via Email"
                  aria-label="Send via Email"
                >
                  {sendingEmail ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <EnvelopeIcon className="w-4 h-4" />
                  )}
                </button>
                <div className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-[#181824] text-gray-200 text-[11px] font-medium rounded-md shadow-2xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Send via Email
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); toast.info('WhatsApp automation is available on demand. Contact support to activate.'); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/15 active:scale-95 transition-all duration-150 relative"
                  title="WhatsApp (On Demand)"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                </button>
                <div className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-[#181824] text-gray-200 text-[11px] font-medium rounded-md shadow-2xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  WhatsApp (On Demand)
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-4 bg-white/10 mx-0.5" />

              {/* Close Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150"
                  title="Close (Esc)"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <div className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-[#181824] text-gray-200 text-[11px] font-medium rounded-md shadow-2xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                  Close (Esc)
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div ref={previewContainerRef} className="flex-1 overflow-auto p-2 sm:p-8 bg-gray-950/70 flex justify-center items-start">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4" />
                <p className="text-gray-400">{isDeliveryChallan ? "Loading delivery challan..." : isQuotation ? "Loading quotation..." : "Loading invoice..."}</p>
              </div>
            ) : previewTemplate ? (() => {
              const previewItems = Array.isArray(enrichedInvoice.items) ? enrichedInvoice.items : [];
              const previewPages = paginateInvoiceItems(previewItems, { isDeliveryChallan });
              const previewTotalPages = previewPages.length;

              return (
                <div className="w-full flex justify-center pb-10">
                  <div 
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                      width: '210mm',
                      marginBottom: previewScale < 1 ? `calc(${previewTotalPages} * 297mm * (${previewScale} - 1))` : 0,
                    }}
                    className="print:transform-none print:w-auto print:m-0"
                  >
                    <div 
                      ref={printRef}
                      data-print-target
                      className="w-[210mm] p-0 m-0 print:w-full print:max-w-none print:shadow-none print:m-0"
                    >
                      <style type="text/css" media="print">{`
                        @page {
                          size: A4 portrait;
                          margin: 0mm;
                        }
                        @page :left {
                          margin: 0mm;
                        }
                        @page :right {
                          margin: 0mm;
                        }
                        body {
                          margin: 0 !important;
                          padding: 0 !important;
                          width: 100% !important;
                        }
                        .invoice-container {
                          display: block !important;
                          gap: 0 !important;
                        }
                        .invoice-sheet {
                          width: 100% !important;
                          max-width: 100% !important;
                          height: 297mm !important;
                          min-height: 297mm !important;
                          max-height: 297mm !important;
                          margin: 0 !important;
                          box-sizing: border-box !important;
                          page-break-after: always !important;
                          break-after: page !important;
                          overflow: hidden !important;
                          display: flex !important;
                          flex-direction: column !important;
                        }
                        .invoice-sheet:last-child {
                          page-break-after: auto !important;
                          break-after: auto !important;
                        }
                        .invoice-part-header {
                          flex-shrink: 0 !important;
                        }
                        .invoice-part-items {
                          flex-grow: 1 !important;
                        }
                        .invoice-part-footer {
                          margin-top: auto !important;
                          flex-shrink: 0 !important;
                        }
                        .invoice-part-continuation {
                          margin-top: auto !important;
                          flex-shrink: 0 !important;
                        }
                      `}</style>
                      <InvoicePreview
                        invoice={enrichedInvoice}
                        template={previewTemplate}
                        businessInfo={effectiveBusinessInfo}
                        invoiceSettings={invoiceSettings || {}}
                      />
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="text-center py-20 text-gray-400">
                <p>No template loaded</p>
                <button
                  onClick={() => setShowDesigner(true)}
                  className="mt-4 text-cyan-400 hover:text-cyan-300"
                >
                  Create a template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Designer Modal */}
      <InvoiceTemplateDesigner
        isOpen={showDesigner}
        onClose={() => {
          setShowDesigner(false);
          const resolvedTemplate = getActiveTemplateForSection({
            sectionKey,
            documentTemplateId: docTemplateId,
            customerTemplates,
            userDefaultTemplates,
          });
          setTemplate(resolvedTemplate);
        }}
        businessInfo={effectiveBusinessInfo}
        documentType={documentType}
        invoice={enrichedInvoice}
      />
    </>,
    document.body
  );
}