import React, { useEffect, useState } from 'react';
import { useRegion } from '../hooks/useRegion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { State, City } from 'country-state-city';

const StoreSettingsSchema = Yup.object().shape({
  country: Yup.string().required('Country is required'),
  state: Yup.string().required('State is required'),
  city: Yup.string().required('City is required'),
  gstin: Yup.string().when('country', {
    is: 'IN',
    then: (schema) => schema.required('GSTIN is required for India').length(15, 'GSTIN must be 15 characters'),
    otherwise: (schema) => schema.notRequired(),
  }),
  trn: Yup.string().when('country', {
    is: 'AE',
    then: (schema) => schema.required('TRN is required for UAE').matches(/^\d{15}$/, 'TRN must be exactly 15 digits'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const StoreSettingsForm: React.FC = () => {
  const { country, currency, trn, gstin, setRegion } = useRegion();

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Store Regional Settings</h2>
      
      <Formik
        initialValues={{
          country: country,
          state: '',
          city: '',
          gstin: gstin || '',
          trn: trn || '',
        }}
        validationSchema={StoreSettingsSchema}
        onSubmit={(values, { setSubmitting }) => {
          setRegion({
            country: values.country as 'IN' | 'AE',
            currency: values.country === 'IN' ? 'INR' : 'AED',
            gstin: values.gstin,
            trn: values.trn,
          });
          setSubmitting(false);
          alert('Settings saved successfully!');
        }}
      >
        {({ values, setFieldValue, isSubmitting }) => {
          
          const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setFieldValue('country', e.target.value);
            setFieldValue('state', '');
            setFieldValue('city', '');
          };

          const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setFieldValue('state', e.target.value);
            setFieldValue('city', '');
          };

          return (
            <Form className="space-y-6">
              
              {/* Country Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Country / Region</label>
                <select
                  name="country"
                  value={values.country}
                  onChange={handleCountryChange}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="IN">India</option>
                  <option value="AE">United Arab Emirates</option>
                </select>
                <ErrorMessage name="country" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* State Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">State / Region</label>
                <Field
                  as="select"
                  name="state"
                  disabled={!values.country}
                  onChange={handleStateChange}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50"
                >
                  <option value="" disabled>Select a state</option>
                  {values.country && State.getStatesOfCountry(values.country).map(state => (
                    <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="state" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* City Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">City</label>
                <Field
                  as="select"
                  name="city"
                  disabled={!values.state}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50"
                >
                  <option value="" disabled>Select a city</option>
                  {values.state && City.getCitiesOfState(values.country, values.state).map(city => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="city" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* Dynamic Tax Fields based on Country */}
              <div className="transition-all duration-300">
                {values.country === 'IN' && (
                  <div className="flex flex-col gap-2 animate-fadeIn">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">GSTIN (India)</label>
                    <Field
                      type="text"
                      name="gstin"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition uppercase"
                    />
                    <ErrorMessage name="gstin" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                )}

                {values.country === 'AE' && (
                  <div className="flex flex-col gap-2 animate-fadeIn">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">TRN (UAE 15-digit)</label>
                    <Field
                      type="text"
                      name="trn"
                      placeholder="e.g. 100000000000003"
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                    <ErrorMessage name="trn" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-70"
                >
                  {isSubmitting ? 'Saving...' : 'Save Regional Settings'}
                </button>
              </div>

            </Form>
          );
        }}
      </Formik>
    </div>
  );
};
