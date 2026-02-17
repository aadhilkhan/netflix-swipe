import { describe, expect, it } from 'vitest';
import { generateId } from '~/utils/id-generator';

describe('generateId', () => {
  it('uses mapped prefixes when available', () => {
    const id = generateId('files');
    expect(id.startsWith('file_')).toBe(true);
  });

  it('uses custom prefixes when no mapping exists', () => {
    const id = generateId('custom');
    expect(id.startsWith('custom_')).toBe(true);
  });

  it('generates unique values', () => {
    const first = generateId('user');
    const second = generateId('user');
    expect(first).not.toBe(second);
  });
});
