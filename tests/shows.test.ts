import { describe, expect, it } from 'vitest';
import { SHOWS, getShowById } from '~/lib/shows/data';

describe('show catalog', () => {
  it('contains unique show ids', () => {
    const ids = SHOWS.map((show) => show.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns a show for a known id', () => {
    const known = SHOWS[0];
    expect(getShowById(known.id)).toEqual(known);
  });

  it('returns undefined for an unknown id', () => {
    expect(getShowById('__unknown-show__')).toBeUndefined();
  });
});
