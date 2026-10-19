import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { State, City } from 'country-state-city';
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  PhoneIcon, 
  UserIcon, 
  SparklesIcon, 
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { setupUserProfile } from '../api/users';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    borderColor: state.isFocused ? 'var(--accent-primary)' : 'var(--border-default)',
    borderRadius: '0.75rem',
    padding: '2px',
    color: 'var(--text-primary)',
    boxShadow: state.isFocused ? '0 0 0 1px var(--accent-primary)' : 'none',
    '&:hover': {
      borderColor: 'var(--border-hover)'
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: '0.75rem',
    zIndex: 100
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'var(--accent-primary)' : state.isFocused ? 'var(--bg-primary)' : 'transparent',
    color: state.isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
    '&:active': {
      backgroundColor: 'var(--accent-primary)'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-primary)'
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--text-primary)'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-muted)'
  })
};

export default function OnboardingWizard({ profile, onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('onboarding_wizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          first_name: parsed.first_name ?? profile?.first_name ?? '',
          last_name: parsed.last_name ?? profile?.last_name ?? '',
          phone: parsed.phone ?? profile?.phone ?? '',
          business_name: parsed.business_name ?? profile?.business_name ?? '',
          business_address: parsed.business_address ?? profile?.business_address ?? '',
          country: parsed.country ?? profile?.country ?? 'IN',
          state: parsed.state ?? profile?.state ?? '',
          city: parsed.city ?? profile?.city ?? '',
          gstin: parsed.gstin ?? profile?.gstin ?? '',
          trn: parsed.trn ?? profile?.trn ?? '',
        };
      }
    } catch (e) {
      console.error("Error loading onboarding draft:", e);
    }
    return {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      business_name: profile?.business_name || '',
      business_address: profile?.business_address || '',
      country: profile?.country || 'IN',
      state: profile?.state || '',
      city: profile?.city || '',
      gstin: profile?.gstin || '',
      trn: profile?.trn || '',
    };
  });

  const queryClient = useQueryClient();

  const setupProfileMutation = useMutation({
    mutationFn: setupUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      queryClient.invalidateQueries(['userProfile']);
      localStorage.removeItem('onboarding_wizard_draft'); // Clean up draft on success
      toast.success('Onboarding details saved successfully!');
      
      setIsOpen(false);
      if (onClose) onClose();
    },
    onError: (error) => {
      const data = error?.response?.data;
      let msg = 'Failed to save onboarding details';
      
      if (data) {
        if (data.message) {
          msg = data.message;
        } else if (data.error) {
          msg = data.error;
        } else if (data.errors) {
          const errs = data.errors;
          if (typeof errs === 'object') {
            msg = Object.entries(errs)
              .map(([field, errList]) => {
                const formattedField = field.replace('_', ' ');
                const formattedErrs = Array.isArray(errList) ? errList.join(', ') : String(errList);
                return `${formattedField}: ${formattedErrs}`;
              })
              .join(' | ');
          } else {
            msg = String(errs);
          }
        } else if (typeof data === 'object') {
          msg = Object.entries(data)
            .map(([field, errList]) => {
              const formattedField = field.replace('_', ' ');
              const formattedErrs = Array.isArray(errList) ? errList.join(', ') : String(errList);
              return `${formattedField}: ${formattedErrs}`;
            })
            .join(' | ');
        }
      }
      toast.error(msg);
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      localStorage.setItem('onboarding_wizard_draft', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectChange = (field, option) => {
    setFormData(prev => {
      const next = { ...prev, [field]: option ? option.value : '' };
      localStorage.setItem('onboarding_wizard_draft', JSON.stringify(next));
      return next;
    });
  };

  const handleNext = (e) => {
    e?.preventDefault();

    // Field validations for steps
    if (currentStep === 1) {
      if (!formData.first_name.trim()) {
        toast.error('First name is required');
        return;
      }
      if (!formData.phone.trim()) {
        toast.error('Phone number is required');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!formData.business_name.trim()) {
        toast.error('Business name is required');
        return;
      }
      setCurrentStep(3);
      return;
    }

    // Step 3: Complete setup & save everything at once
    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim(),
      business_name: formData.business_name.trim(),
      business_address: formData.business_address.trim(),
      country: formData.country,
      state: formData.state,
      city: formData.city
    };

    if (formData.country === 'IN') {
      payload.gstin = formData.gstin.trim() || null;
      payload.trn = null;
    } else if (formData.country === 'AE') {
      payload.trn = formData.trn.trim() || null;
      payload.gstin = null;
    }

    setupProfileMutation.mutate(payload);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // If they skip completely
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.removeItem('onboarding_wizard_draft'); // Clean up draft on skip too
    setIsOpen(false);
    if (onClose) onClose();
    toast.info('You can complete your business setup anytime in the Profile settings.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 md:p-8 relative shadow-2xl animate-fade-up">
        {/* Skip Button */}
        <button 
          onClick={handleSkip}
          type="button"
          className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-default)] hover:border-[var(--border-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all bg-[var(--bg-primary)]/40 cursor-pointer"
        >
          Skip Wizard
          <XMarkIcon className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/15 flex items-center justify-center border border-[var(--accent-primary)]/30">
            <SparklesIcon className="w-6 h-6 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">Complete Business Onboarding</h3>
            <p className="text-xs text-[var(--accent-primary)] font-semibold tracking-wider uppercase mt-0.5">Step {currentStep} of 3</p>
          </div>
        </div>

        {/* Steps Status Indicators */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div 
              key={step}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                step === currentStep 
                  ? 'bg-[var(--accent-primary)] w-1/3' 
                  : step < currentStep 
                  ? 'bg-[var(--accent-primary)]/60' 
                  : 'bg-[var(--border-default)]'
              }`}
            ></div>
          ))}
        </div>

        <form onSubmit={handleNext} className="space-y-6">
          {/* STEP 1: Personal details (Max 3 fields) */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="text-left mb-2">
                <h4 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  Personal Information
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Let us know how to address you and verify contact details.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                    placeholder="E.g. John"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                    placeholder="E.g. Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                  placeholder="E.g. +91 98765 43210"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: Business setup (Max 2 fields) */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="text-left mb-2">
                <h4 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <BuildingOfficeIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  Business Setup
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Provide your business identity details which appear on invoices.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Business / Shop Name *</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                  placeholder="E.g. Acme Retailers"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Complete Business Address</label>
                <textarea
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all resize-none"
                  placeholder="E.g. 123 Main Street, Sector 5..."
                ></textarea>
              </div>
            </div>
          )}

          {/* STEP 3: Regional & Tax constraints (Max 3 fields) */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="text-left mb-2">
                <h4 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  Regional Settings & Taxes
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Verify your operation country, state context, and optional tax codes.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Country *</label>
                  <Select
                    options={[
                      { value: 'IN', label: 'India' },
                      { value: 'AE', label: 'United Arab Emirates' }
                    ]}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={customSelectStyles}
                    onChange={(opt) => {
                      handleSelectChange('country', opt);
                      setFormData(prev => ({ ...prev, state: '', city: '' }));
                    }}
                    value={{ value: formData.country, label: formData.country === 'IN' ? 'India' : 'United Arab Emirates' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">State / Region *</label>
                  <Select
                    options={State.getStatesOfCountry(formData.country).map(state => ({ value: state.isoCode, label: state.name }))}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select State"
                    styles={customSelectStyles}
                    onChange={(opt) => {
                      handleSelectChange('state', opt);
                      setFormData(prev => ({ ...prev, city: '' }));
                    }}
                    value={formData.state ? { value: formData.state, label: State.getStateByCodeAndCountry(formData.state, formData.country)?.name || formData.state } : null}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">City</label>
                  <Select
                    options={City.getCitiesOfState(formData.country, formData.state).map(city => ({ value: city.name, label: city.name }))}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select City"
                    styles={customSelectStyles}
                    isDisabled={!formData.state}
                    onChange={(opt) => handleSelectChange('city', opt)}
                    value={formData.city ? { value: formData.city, label: formData.city } : null}
                  />
                </div>

                {formData.country === 'IN' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">GSTIN (Optional)</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                )}

                {formData.country === 'AE' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">TRN (Optional, 15-digit)</label>
                    <input
                      type="text"
                      name="trn"
                      value={formData.trn}
                      onChange={handleInputChange}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      placeholder="100000000000003"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--border-default)] mt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || setupProfileMutation.isPending}
              className="btn-secondary !text-sm flex items-center gap-1.5"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back
            </button>

            <button
              type="submit"
              disabled={setupProfileMutation.isPending}
              className="btn-primary !text-sm flex items-center gap-2"
            >
              {setupProfileMutation.isPending ? 'Saving details...' : currentStep === 3 ? 'Complete Setup' : 'Save & Continue'}
              {currentStep < 3 ? <ChevronRightIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
