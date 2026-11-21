import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Formik, Form } from 'formik';
import { CustomerAutocomplete } from './SalesForm';

// Mock getCustomers API
vi.mock('../../api/customers', () => ({
  getCustomers: vi.fn().mockResolvedValue([]),
  patchCustomer: vi.fn().mockResolvedValue({}),
}));

const mockCustomers = [
  {
    id: 1,
    name: 'KIIT University',
    email: 'contact@kiit.ac.in',
    phone: '9876543210',
    address: 'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha',
    gstin: '21AABCI0345Q1Z0',
    state: 'Odisha',
  },
  {
    id: 2,
    name: 'Tata Consultancy Services',
    email: 'info@tcs.com',
    phone: '9876543211',
    address: 'Salt Lake, Sector V, Kolkata 700091, West Bengal',
    gstin: '19AABCT1234F1Z5',
    state: 'West Bengal',
  },
];

function renderCustomerAutocomplete(props = {}, formikProps = {}) {
  const initialValues = {
    customer: null,
    customer_id: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_gstin: '',
    delivery_address: '',
    place_of_supply: '',
    default_pos: '',
    bill_to_ship_to: false,
    ...formikProps.initialValues,
  };

  const defaultProps = {
    customers: mockCustomers,
    ...props,
  };

  return render(
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      {(formik) => (
        <Form>
          <CustomerAutocomplete
            values={formik.values}
            setFieldValue={(field, value) => {
              formik.setFieldValue(field, value);
              if (props.onSetFieldValue) {
                props.onSetFieldValue(field, value);
              }
            }}
            customers={defaultProps.customers}
          />
          {/* Card simulating SalesForm billing details display */}
          {Boolean(formik.values.customer_name?.trim()) &&
            (formik.values.customer_address || formik.values.customer_gstin) && (
              <div data-testid="billing-details-box">
                {formik.values.customer_gstin && <span>GSTIN: {formik.values.customer_gstin}</span>}
                {formik.values.customer_address && <span>Address: {formik.values.customer_address}</span>}
              </div>
            )}
        </Form>
      )}
    </Formik>
  );
}

describe('CustomerAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('populates customer details when a customer is selected from dropdown', () => {
    const onSetFieldValue = vi.fn();
    renderCustomerAutocomplete({ onSetFieldValue });

    const input = screen.getByPlaceholderText('Customer name');
    fireEvent.change(input, { target: { value: 'KIIT' } });

    // Click customer option in dropdown
    const option = screen.getByText('KIIT University');
    fireEvent.mouseDown(option);

    expect(onSetFieldValue).toHaveBeenCalledWith('customer_name', 'KIIT University');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer', 1);
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_email', 'contact@kiit.ac.in');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_phone', '9876543210');
    expect(onSetFieldValue).toHaveBeenCalledWith(
      'customer_address',
      'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha'
    );
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_gstin', '21AABCI0345Q1Z0');
    expect(onSetFieldValue).toHaveBeenCalledWith(
      'delivery_address',
      'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha'
    );
    expect(onSetFieldValue).toHaveBeenCalledWith('place_of_supply', 'OR');
    expect(onSetFieldValue).toHaveBeenCalledWith('default_pos', 'OR');
  });

  it('clears all customer details and shipping address when customer name is emptied', () => {
    const onSetFieldValue = vi.fn();
    renderCustomerAutocomplete(
      { onSetFieldValue },
      {
        initialValues: {
          customer: 1,
          customer_name: 'KIIT University',
          customer_address: 'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha',
          customer_gstin: '21AABCI0345Q1Z0',
          delivery_address: 'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha',
          place_of_supply: '21',
          default_pos: '21',
        },
      }
    );

    const input = screen.getByPlaceholderText('Customer name');
    expect(input.value).toBe('KIIT University');

    // User clears the customer input
    fireEvent.change(input, { target: { value: '' } });

    expect(onSetFieldValue).toHaveBeenCalledWith('customer_name', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer', null);
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_id', null);
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_address', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_gstin', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('delivery_address', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('place_of_supply', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('default_pos', '');
  });

  it('clears previous customer details when typing a new unmatching name', () => {
    const onSetFieldValue = vi.fn();
    renderCustomerAutocomplete(
      { onSetFieldValue },
      {
        initialValues: {
          customer: 1,
          customer_name: 'KIIT University',
          customer_address: 'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha',
          customer_gstin: '21AABCI0345Q1Z0',
        },
      }
    );

    const input = screen.getByPlaceholderText('Customer name');
    fireEvent.change(input, { target: { value: 'New Unsaved Client' } });

    expect(onSetFieldValue).toHaveBeenCalledWith('customer_name', 'New Unsaved Client');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer', null);
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_address', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_gstin', '');
  });

  it('clears customer name and details when clicking the clear (X) button', () => {
    const onSetFieldValue = vi.fn();
    renderCustomerAutocomplete(
      { onSetFieldValue },
      {
        initialValues: {
          customer: 1,
          customer_name: 'KIIT University',
          customer_address: 'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha',
          customer_gstin: '21AABCI0345Q1Z0',
          delivery_address: 'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha',
          place_of_supply: '21',
          default_pos: '21',
        },
      }
    );

    const clearBtn = screen.getByRole('button', { name: /clear customer/i });
    expect(clearBtn).toBeDefined();

    fireEvent.click(clearBtn);

    const input = screen.getByPlaceholderText('Customer name');
    expect(input.value).toBe('');

    expect(onSetFieldValue).toHaveBeenCalledWith('customer_name', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer', null);
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_address', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('customer_gstin', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('delivery_address', '');
    expect(onSetFieldValue).toHaveBeenCalledWith('place_of_supply', '');
  });

  it('does not display billing details card when customer name is empty', () => {
    renderCustomerAutocomplete(
      {},
      {
        initialValues: {
          customer: null,
          customer_name: '',
          customer_address: 'E-5, Infocity, KIIT Post Office, Bhubaneshwar 751024, Odisha',
          customer_gstin: '21AABCI0345Q1Z0',
        },
      }
    );

    // Because customer_name is empty, the billing details box should not be rendered
    expect(screen.queryByTestId('billing-details-box')).toBeNull();
  });
});
