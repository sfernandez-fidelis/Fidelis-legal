import { describe, expect, it } from 'vitest';
import { formatDateInWords, formatDPI, getPartyIdentityNumber } from './formatters';

describe('pdf formatters', () => {
  it('formats CUI values with words and grouped digits', () => {
    expect(formatDPI('2646152630101')).toBe(
      'dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101)',
    );
  });

  it('falls back to whichever identity field is populated', () => {
    expect(getPartyIdentityNumber({ idNumber: '1234567890101', cui: '' })).toBe('1234567890101');
    expect(getPartyIdentityNumber({ idNumber: '', cui: '9876543210101' })).toBe('9876543210101');
  });

  it('formats legal dates in words and supports the year label variant', () => {
    expect(formatDateInWords('2026-04-10')).toBe('diez de abril de dos mil veintiseis');
    expect(formatDateInWords('2026-04-10', { includeYearLabel: true })).toBe('diez de abril del año dos mil veintiseis');
  });
});
