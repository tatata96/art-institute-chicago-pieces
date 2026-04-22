import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildImageUrl, fetchArtworks } from './artworks'

describe('buildImageUrl', () => {
  it('returns a small IIIF image URL', () => {
    expect(buildImageUrl('abc123')).toBe(
      'https://www.artic.edu/iiif/2/abc123/full/400,/0/default.jpg',
    )
  })
})

describe('fetchArtworks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  function mockArtwork(id, imageId = `img-${id}`) {
    return {
      id,
      title: `Painting ${id}`,
      artist_display: `Artist ${id}`,
      date_start: 1889,
      date_end: 1889,
      date_display: '1889',
      medium_display: 'Oil on canvas',
      image_id: imageId,
      department_title: 'Painting and Sculpture',
      place_of_origin: 'France',
      artwork_type_title: 'Painting',
      style_title: 'Impressionism',
      classification_title: 'painting',
    }
  }

  it('fetches paginated public-domain artwork pages and normalizes records with images', async () => {
    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            mockArtwork(1, 'img-a'),
            {
              id: 2,
              title: 'No image',
              image_id: null,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockArtwork(3, 'img-c')],
        }),
      })

    const result = await fetchArtworks({limit: 2, pageLimit: 1})

    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(globalThis.fetch.mock.calls[0][0]).toContain('limit=1')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('page=1')
    expect(globalThis.fetch.mock.calls[1][0]).toContain('page=2')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('is_public_domain')
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        title: 'Painting 1',
        artist: 'Artist 1',
        century: '19th century',
        movement_primary: 'Impressionism',
        subject_primary: 'Painting',
        medium_category: 'painting',
        country: 'France',
        image_url: 'https://www.artic.edu/iiif/2/img-a/full/400,/0/default.jpg',
      }),
      expect.objectContaining({
        id: 3,
        image_url: 'https://www.artic.edu/iiif/2/img-c/full/400,/0/default.jpg',
      }),
    ])
  })

  it('uses a safe page limit when fetching 800 artworks', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: Array.from({length: 100}, (_, index) => mockArtwork(index + 1)),
      }),
    })

    const result = await fetchArtworks({limit: 800})

    expect(result).toHaveLength(800)
    expect(globalThis.fetch).toHaveBeenCalledTimes(8)
    expect(globalThis.fetch.mock.calls[0][0]).toContain('limit=100')
    expect(globalThis.fetch.mock.calls[7][0]).toContain('page=8')
  })

  it('throws on non-ok responses', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 })

    await expect(fetchArtworks()).rejects.toThrow(
      'Failed to fetch Art Institute artworks page 1: 500',
    )
  })
})
