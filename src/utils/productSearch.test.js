import { describe, it, expect } from 'vitest';
import { matchesProductSearch, filterProductsBySearch } from './productSearch';

describe('productSearch', () => {
  const sampleProducts = [
    {
      id: '1',
      name: '7-Ethoxycoumarin, 98%',
      item_code: '16844-100mg',
      internal_reference: 'Part B',
      manufacturer: 'SRL',
      hsn_sac_code: '322010',
    },
    {
      id: '2',
      name: 'Coumarin pure, 98%',
      item_code: '42074-100g',
      internal_reference: 'Part B',
      manufacturer: 'SRL',
      hsn_sac_code: '322010',
    },
    {
      id: '3',
      name: 'Sodium Chloride AR',
      item_code: '322010-SPECIAL',
      internal_reference: 'Batch 9',
      manufacturer: 'Merck',
      hsn_sac_code: '282739',
    },
  ];

  it('matches by product name', () => {
    expect(matchesProductSearch(sampleProducts[0], 'ethoxycoumarin')).toBe(true);
    expect(matchesProductSearch(sampleProducts[0], '7-ethoxy')).toBe(true);
    expect(matchesProductSearch(sampleProducts[1], 'coumarin pure')).toBe(true);
    expect(matchesProductSearch(sampleProducts[2], 'coumarin')).toBe(false);
  });

  it('matches by item_code', () => {
    expect(matchesProductSearch(sampleProducts[0], '16844')).toBe(true);
    expect(matchesProductSearch(sampleProducts[1], '42074')).toBe(true);
    expect(matchesProductSearch(sampleProducts[2], '322010')).toBe(true); // matches because item_code contains 322010
  });

  it('matches by internal_reference', () => {
    expect(matchesProductSearch(sampleProducts[0], 'Part B')).toBe(true);
    expect(matchesProductSearch(sampleProducts[2], 'Batch 9')).toBe(true);
  });

  it('matches by manufacturer', () => {
    expect(matchesProductSearch(sampleProducts[0], 'SRL')).toBe(true);
    expect(matchesProductSearch(sampleProducts[2], 'Merck')).toBe(true);
  });

  it('strictly DOES NOT match when query only matches HSN / SAC code', () => {
    // sampleProducts[0] and sampleProducts[1] have hsn_sac_code: '322010',
    // but neither their name, code, ref, nor manufacturer contains '322010'.
    expect(matchesProductSearch(sampleProducts[0], '322010')).toBe(false);
    expect(matchesProductSearch(sampleProducts[1], '322010')).toBe(false);

    // filterProductsBySearch should only return product 3 because its item_code has '322010'
    const results = filterProductsBySearch(sampleProducts, '322010');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('3');
  });

  it('handles null/undefined products and empty queries safely', () => {
    expect(matchesProductSearch(null, 'test')).toBe(false);
    expect(matchesProductSearch({}, 'test')).toBe(false);
    expect(matchesProductSearch(sampleProducts[0], '')).toBe(true);
    expect(matchesProductSearch(sampleProducts[0], null)).toBe(true);
    expect(filterProductsBySearch([], 'test')).toEqual([]);
    expect(filterProductsBySearch(sampleProducts, '')).toEqual([]);
  });
});
