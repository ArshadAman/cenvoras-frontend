import { describe, it, expect } from 'vitest';
import {
  matchesProductSearch,
  scoreProductRelevance,
  sortProductsByRelevance,
  filterProductsBySearch,
} from './productSearch';

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

describe('scoreProductRelevance', () => {
  it('scores exact item_code match highest (0)', () => {
    expect(scoreProductRelevance({ item_code: 'TP-RK-200', name: 'Racked Pipette Tips 200ul' }, 'tp-rk-200')).toBe(0);
  });

  it('scores item_code-starts-with as 1', () => {
    expect(scoreProductRelevance({ item_code: 'TP-RK-200L', name: 'Racked Pipette Tips 200ul Long' }, 'tp-rk-200')).toBe(1);
  });

  it('scores name-starts-with as 2 when item_code does not match', () => {
    expect(scoreProductRelevance({ item_code: 'CAT-1', name: 'TP-RK-200 Racked Tips' }, 'tp-rk-200')).toBe(2);
  });

  it('scores item_code-contains (not at start) as 3', () => {
    expect(scoreProductRelevance({ item_code: 'FTP-RK-200', name: 'Racked Pipette Tips with Filter 200ul' }, 'tp-rk-200')).toBe(3);
  });

  it('scores name-contains (not at start) as 4', () => {
    expect(scoreProductRelevance({ item_code: 'CAT-2', name: 'Lab TP-RK-200 Tips' }, 'tp-rk-200')).toBe(4);
  });

  it('scores internal_reference or manufacturer match as 5', () => {
    expect(scoreProductRelevance({ item_code: 'CAT-3', name: 'Pipette Tips', manufacturer: 'Microlit' }, 'microlit')).toBe(5);
    expect(scoreProductRelevance({ item_code: 'CAT-4', name: 'Pipette Tips', internal_reference: 'Part B' }, 'part b')).toBe(5);
  });

  it('returns -1 for non-matching product or empty query', () => {
    expect(scoreProductRelevance({ item_code: 'BEAKER-500', name: 'Glass Beaker' }, 'tp-rk')).toBe(-1);
    expect(scoreProductRelevance({ item_code: 'TP-RK-200', name: 'Tips' }, '')).toBe(-1);
  });
});

describe('filterProductsBySearch relevance sorting', () => {
  it('places exact item_code match first and starts-with before contains (tp-rk-200)', () => {
    const products = [
      { id: 1, name: 'FTP-RK-200L: Racked Pipette Tips with Filter 200ul Long', item_code: 'FTP-RK-200L' },
      { id: 2, name: 'FTP-RK-200: Racked Pipette Tips with Filter 200ul', item_code: 'FTP-RK-200' },
      { id: 3, name: 'TP-RK-200L: Racked Pipette Tips 200ul Long', item_code: 'TP-RK-200L' },
      { id: 4, name: 'TP-RK-200: Racked Pipette Tips 200ul', item_code: 'TP-RK-200' },
    ];
    const results = filterProductsBySearch(products, 'tp-rk-200');
    expect(results.map((p) => p.item_code)).toEqual([
      'TP-RK-200',
      'TP-RK-200L',
      'FTP-RK-200',
      'FTP-RK-200L',
    ]);
  });

  it('places exact item_code match first for tp-rk-10', () => {
    const products = [
      { id: 1, name: 'FTP-RK-10000: Filter 10ml', item_code: 'FTP-RK-10000' },
      { id: 2, name: 'FTP-RK-1000L: Filter 1000ul Long', item_code: 'FTP-RK-1000L' },
      { id: 3, name: 'FTP-RK-1000: Filter 1000ul', item_code: 'FTP-RK-1000' },
      { id: 4, name: 'FTP-RK-100: Filter 100ul', item_code: 'FTP-RK-100' },
      { id: 5, name: 'TP-RK-1000: Tips 1000ul', item_code: 'TP-RK-1000' },
      { id: 6, name: 'TP-RK-10L: Tips 10ul Long', item_code: 'TP-RK-10L' },
      { id: 7, name: 'TP-RK-10: Tips 10ul', item_code: 'TP-RK-10' },
    ];
    const results = filterProductsBySearch(products, 'tp-rk-10');
    expect(results[0].item_code).toBe('TP-RK-10');
    expect(results[1].item_code).toBe('TP-RK-1000');
    expect(results[2].item_code).toBe('TP-RK-10L');
    expect(results.slice(3).map((p) => p.item_code)).toEqual([
      'FTP-RK-100',
      'FTP-RK-1000',
      'FTP-RK-10000',
      'FTP-RK-1000L',
    ]);
  });

  it('orders name-starts-with before item_code-contains and manufacturer-only matches', () => {
    const products = [
      { id: 1, name: 'Glass Flask', item_code: 'GF-1', manufacturer: 'Alpha Co' },
      { id: 2, name: 'Beta Tube', item_code: 'X-ALPHA-1' },
      { id: 3, name: 'Alpha Pipette', item_code: 'AP-1' },
      { id: 4, name: 'Gamma Beaker', item_code: 'ALPHA-1' },
    ];
    const results = filterProductsBySearch(products, 'alpha');
    expect(results.map((p) => p.id)).toEqual([4, 3, 2, 1]);
  });

  it('sortProductsByRelevance preserves order on empty query without mutating input', () => {
    const original = [{ id: 2, name: 'B' }, { id: 1, name: 'A' }];
    const sorted = sortProductsByRelevance(original, '');
    expect(sorted).toEqual(original);
    expect(sorted).not.toBe(original);
  });
});
