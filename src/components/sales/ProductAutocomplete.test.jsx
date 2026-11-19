import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Formik, Form } from 'formik';
import { ProductAutocomplete } from './SalesForm';

// Mock getProducts API
vi.mock('../../api/sales', () => ({
  createSalesInvoice: vi.fn(),
  updateSalesInvoice: vi.fn(),
  getProducts: vi.fn().mockResolvedValue([]),
  getNextInvoiceNumber: vi.fn(),
}));

const mockProducts = [
  {
    id: 101,
    name: '97866-125ml: Methylene Blue 1% Aq. soln.',
    item_code: '97866-125ml',
    manufacturer: 'SRL',
    internal_reference: 'Part A',
    unit: 'pcs',
    sale_price: 150,
    price: 150,
    tax: 18,
    hsn_code: '3204',
    description: '125ml solution',
  },
  {
    id: 102,
    name: '97866-250ml: Methylene Blue 1% Aq. soln.',
    item_code: '97866-250ml',
    manufacturer: 'SRL',
    internal_reference: 'Part A',
    unit: 'pcs',
    sale_price: 250,
    price: 250,
    tax: 18,
    hsn_code: '3204',
    description: '250ml solution',
  },
  {
    id: 103,
    name: 'Normal Saline 0.9% 500ml',
    item_code: 'NS-500',
    unit: 'btl',
    sale_price: 50,
    price: 50,
  },
];

function renderAutocomplete(props = {}) {
  const initialValues = {
    items: [
      { product: '', quantity: 1, price: 0, amount: 0, description: '' },
      { product: '', quantity: 1, price: 0, amount: 0, description: '' },
    ],
  };

  const defaultProps = {
    idx: 0,
    values: initialValues,
    setFieldValue: vi.fn(),
    onInputChange: vi.fn(),
    products: mockProducts,
    showDescription: true,
    showManufacturer: true,
    onCreateNewProduct: vi.fn(),
    onSelectProduct: vi.fn(),
    activeDropdownIdx: 0,
    setActiveDropdownIdx: vi.fn(),
  };

  const mergedProps = { ...defaultProps, ...props };

  return {
    ...render(
      <Formik initialValues={mergedProps.values} onSubmit={vi.fn()}>
        {({ values, setFieldValue }) => (
          <Form>
            <ProductAutocomplete
              {...mergedProps}
              values={values}
              setFieldValue={mergedProps.setFieldValue || setFieldValue}
            />
          </Form>
        )}
      </Formik>
    ),
    props: mergedProps,
  };
}

describe('ProductAutocomplete - Option B: Pinned Dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store = {};
    const mockStorage = {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('shows dropdown when typing search query', () => {
    renderAutocomplete();
    const input = screen.getByPlaceholderText('Product name');

    fireEvent.change(input, { target: { value: '97866' } });

    expect(screen.getByText(/97866-125ml: Methylene Blue/i)).toBeTruthy();
    expect(screen.getByText(/97866-250ml: Methylene Blue/i)).toBeTruthy();
  });

  it('keeps dropdown pinned open when input loses focus (Option B)', () => {
    renderAutocomplete();
    const input = screen.getByPlaceholderText('Product name');

    // Type query
    fireEvent.change(input, { target: { value: '97866' } });
    expect(screen.getByText(/97866-125ml: Methylene Blue/i)).toBeTruthy();

    // Blur the input (simulate clicking elsewhere or switching screens/monitors)
    fireEvent.blur(input);

    // Dropdown MUST remain visible in document.body
    expect(screen.getByText(/97866-125ml: Methylene Blue/i)).toBeTruthy();
    expect(screen.getByText(/97866-250ml: Methylene Blue/i)).toBeTruthy();
  });

  it('closes dropdown when an item is clicked/selected', () => {
    const onSelectProduct = vi.fn();
    const setFieldValue = vi.fn();
    renderAutocomplete({ onSelectProduct, setFieldValue });
    const input = screen.getByPlaceholderText('Product name');

    fireEvent.change(input, { target: { value: '97866' } });
    const firstOption = screen.getByText(/97866-125ml: Methylene Blue/i);

    fireEvent.mouseDown(firstOption);

    expect(setFieldValue).toHaveBeenCalledWith('items.0.product', mockProducts[0].name);
    expect(setFieldValue).toHaveBeenCalledWith('items.0.product_id', mockProducts[0].id);
    expect(onSelectProduct).toHaveBeenCalledWith(mockProducts[0]);

    // Dropdown should now be closed
    expect(screen.queryByText(/97866-250ml: Methylene Blue/i)).toBeNull();
  });

  it('closes dropdown when Escape key is pressed', () => {
    renderAutocomplete();
    const input = screen.getByPlaceholderText('Product name');

    fireEvent.change(input, { target: { value: '97866' } });
    expect(screen.getByText(/97866-125ml: Methylene Blue/i)).toBeTruthy();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByText(/97866-125ml: Methylene Blue/i)).toBeNull();
  });

  it('closes dropdown when input is cleared', () => {
    renderAutocomplete();
    const input = screen.getByPlaceholderText('Product name');

    fireEvent.change(input, { target: { value: '97866' } });
    expect(screen.getByText(/97866-125ml: Methylene Blue/i)).toBeTruthy();

    fireEvent.change(input, { target: { value: '' } });

    expect(screen.queryByText(/97866-125ml: Methylene Blue/i)).toBeNull();
  });

  it('closes dropdown when activeDropdownIdx moves to a different row', () => {
    const { rerender, props } = renderAutocomplete({ idx: 0, activeDropdownIdx: 0 });
    const input = screen.getByPlaceholderText('Product name');

    fireEvent.change(input, { target: { value: '97866' } });
    expect(screen.getByText(/97866-125ml: Methylene Blue/i)).toBeTruthy();

    // Re-render with activeDropdownIdx changed to row 1
    rerender(
      <Formik initialValues={props.values} onSubmit={vi.fn()}>
        {({ values, setFieldValue }) => (
          <Form>
            <ProductAutocomplete
              {...props}
              idx={0}
              activeDropdownIdx={1}
              values={values}
              setFieldValue={setFieldValue}
            />
          </Form>
        )}
      </Formik>
    );

    // Row 0's dropdown must be closed
    expect(screen.queryByText(/97866-125ml: Methylene Blue/i)).toBeNull();
  });

  it('shows "+ Add to inventory" when there is no exact match and closes on click', () => {
    const onCreateNewProduct = vi.fn();
    renderAutocomplete({ onCreateNewProduct });
    const input = screen.getByPlaceholderText('Product name');

    fireEvent.change(input, { target: { value: '97866' } });

    const addButton = screen.getByText(/Add to inventory: "97866"/i);
    expect(addButton).toBeTruthy();

    fireEvent.mouseDown(addButton);
    expect(onCreateNewProduct).toHaveBeenCalledWith('97866', 0);
    expect(screen.queryByText(/Add to inventory: "97866"/i)).toBeNull();
  });

  it('does not display products when search query only matches HSN code', () => {
    renderAutocomplete();
    const input = screen.getByPlaceholderText('Product name');

    // '3204' is the hsn_code for mockProducts[0] and mockProducts[1], but is not in name/code/ref/mfr
    fireEvent.change(input, { target: { value: '3204' } });

    expect(screen.queryByText(/97866-125ml: Methylene Blue/i)).toBeNull();
    expect(screen.queryByText(/97866-250ml: Methylene Blue/i)).toBeNull();
  });
});
