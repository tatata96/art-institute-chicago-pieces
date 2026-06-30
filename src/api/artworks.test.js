import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildImageUrl, fetchArtworks } from './artworks'

describe('buildImageUrl', () => {
  it('returns the provided image URL', () => {
    expect(buildImageUrl('https://openaccess-cdn.clevelandart.org/example.jpg')).toBe(
      'https://openaccess-cdn.clevelandart.org/example.jpg',
    )
  })
})

describe('fetchArtworks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  function mockArtwork(id, overrides = {}) {
    return {
      id,
      title: `Painting ${id}`,
      creation_date_earliest: 1889,
      creation_date_latest: 1889,
      creation_date: '1889',
      technique: 'Oil on canvas',
      department: 'American Painting and Sculpture',
      collection: 'American - Painting',
      type: 'Painting',
      culture: ['America'],
      creators: [
        {
          role: 'artist',
          description: `Artist ${id} (American, 1850-1900)`,
        },
      ],
      images: {
        web: {
          url: `https://openaccess-cdn.clevelandart.org/${id}/${id}_web.jpg`,
        },
        print: {
          url: `https://openaccess-cdn.clevelandart.org/${id}/${id}_print.jpg`,
        },
      },
      ...overrides,
    }
  }

  it('fetches paginated Cleveland artworks and normalizes records with images', async () => {
    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            mockArtwork(1),
            mockArtwork(2, {
              images: {},
            }),
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockArtwork(3)],
        }),
      })

    const result = await fetchArtworks({limit: 2, pageLimit: 1})

    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/cma-api/api/artworks/')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('has_image=1')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('limit=1')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('skip=0')
    expect(globalThis.fetch.mock.calls[1][0]).toContain('skip=1')
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        title: 'Painting 1',
        artist: 'Artist 1 (American, 1850-1900)',
        century: '19th century',
        movement_primary: 'American Painting and Sculpture',
        subject_primary: 'Painting',
        medium_category: 'Oil on canvas',
        country: 'America',
        image_url: 'https://openaccess-cdn.clevelandart.org/1/1_web.jpg',
        large_image_url: 'https://openaccess-cdn.clevelandart.org/1/1_print.jpg',
      }),
      expect.objectContaining({
        id: 3,
        image_url: 'https://openaccess-cdn.clevelandart.org/3/3_web.jpg',
        large_image_url: 'https://openaccess-cdn.clevelandart.org/3/3_print.jpg',
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
    expect(globalThis.fetch.mock.calls[7][0]).toContain('skip=700')
  })

  it('throws on non-ok responses', async () => {
    globalThis.fetch.mockResolvedValueOnce({ok: false, status: 500})

    await expect(fetchArtworks()).rejects.toThrow('Failed to fetch Cleveland artworks: 500')
  })
})
