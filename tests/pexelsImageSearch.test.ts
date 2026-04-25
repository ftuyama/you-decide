import { describe, expect, it } from 'vitest';
import { normalizePexelsSearchResponse } from '../src/dev/pexelsImageSearch.ts';

describe('normalizePexelsSearchResponse', () => {
  it('returns empty array for non-object body', () => {
    expect(normalizePexelsSearchResponse(null)).toEqual([]);
    expect(normalizePexelsSearchResponse([])).toEqual([]);
    expect(normalizePexelsSearchResponse('x')).toEqual([]);
  });

  it('returns empty when photos missing', () => {
    expect(normalizePexelsSearchResponse({})).toEqual([]);
    expect(normalizePexelsSearchResponse({ photos: null })).toEqual([]);
  });

  it('maps Pexels-shaped photos to hits', () => {
    const body = {
      photos: [
        {
          id: 42,
          url: 'https://www.pexels.com/photo/x/',
          photographer: 'Ada',
          photographer_url: 'https://www.pexels.com/@ada',
          src: {
            original: 'https://images.pexels.com/original.jpg',
            large2x: 'https://images.pexels.com/large2x.jpg',
            large: 'https://images.pexels.com/large.jpg',
            tiny: 'https://images.pexels.com/tiny.jpg',
          },
        },
      ],
    };
    expect(normalizePexelsSearchResponse(body)).toEqual([
      {
        id: '42',
        pageUrl: 'https://www.pexels.com/photo/x/',
        photographer: 'Ada',
        photographerUrl: 'https://www.pexels.com/@ada',
        imageUrl: 'https://images.pexels.com/large2x.jpg',
        thumbUrl: 'https://images.pexels.com/tiny.jpg',
      },
    ]);
  });

  it('skips entries without id or imageUrl', () => {
    const body = {
      photos: [
        { id: 1, src: {} },
        { id: 2, src: { medium: 'https://x/m.jpg' } },
      ],
    };
    expect(normalizePexelsSearchResponse(body)).toEqual([
      {
        id: '2',
        pageUrl: '',
        photographer: '',
        photographerUrl: '',
        imageUrl: 'https://x/m.jpg',
        thumbUrl: 'https://x/m.jpg',
      },
    ]);
  });
});
